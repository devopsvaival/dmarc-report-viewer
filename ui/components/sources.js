import { LitElement, html } from "lit";
import { globalStyle, reportsFilterStyle } from "../style.js";
import { renderColumnFilterRow, rowMatchesFilters } from "../utils.js";

const COUNT_FILTERS = [
    { value: "", label: "Any", test: () => true },
    { value: "lt100", label: "Less than 100", test: count => count < 100 },
    { value: "gt100", label: "More than 100", test: count => count > 100 },
    { value: "gt500", label: "More than 500", test: count => count > 500 },
    { value: "gt1000", label: "More than 1000", test: count => count > 1000 },
    { value: "gt10000", label: "More than 10000", test: count => count > 10000 },
];

const ISSUE_LABELS = {
    "SpfPolicy": "SPF Policy",
    "SpfAuth": "SPF Auth",
    "DkimPolicy": "DKIM Policy",
    "DkimAuth": "DKIM Auth",
    "StarttlsNotSupported": "No STARTTLS Support",
    "CertificateHostMismatch": "Certificate Mismatch",
    "CertificateExpired": "Certificate Expired",
    "CertificateNotTrusted": "No Certificate Trust",
    "ValidationFailure": "Validation Failure",
    "TlsaInvalid": "TLSA Invalid",
    "DnssecInvalid": "DNSSEC Invalid",
    "DaneRequired": "DANE Required",
    "StsPolicyFetchError": "STS Policy Fetch Error",
    "StsPolicyInvalid": "STS Policy Invalid",
    "StsWebpkiInvalid": "STS WebPKI Invalid",
};

const TYPE_LABELS = {
    "Dmarc": "DMARC",
    "Tls": "SMTP TLS",
};

export class Sources extends LitElement {
    static styles = [globalStyle, reportsFilterStyle];

    static properties = {
        params: { type: Object },
        sources: { type: Array },
        filterState: { type: Object },
        countFilter: { type: String },
    };

    constructor() {
        super();
        this.params = {};
        this.sources = [];
        this.filtered = false;
        this.filterState = {};
        this.countFilter = "";
    }

    updated(changedProperties) {
        if (changedProperties.has("params")) {
            this.updateSources();
        }
    }

    async updateSources() {
        const sourcesResponse = await fetch("sources");
        this.filtered = false;
        this.filterState = {};
        this.countFilter = "";
        this.sources = await sourcesResponse.json();
        if (this.params.domain) {
            const lcDomain = this.params.domain.toLowerCase();
            this.sources = this.sources.filter(s => s.domain.toLowerCase() === lcDomain);
            this.filtered = true;
        }
        if (this.params.issues) {
            this.sources = this.sources.filter(s => s.issues.length > 0);
            this.filtered = true;
        }
        if (this.params.type) {
            this.sources = this.sources.filter(s => s.types.includes(this.params.type));
            this.filtered = true;
        }

        const chunkSize = 100;
        let startOffset = 0;
        let chunk = [];
        for (let i = 0; i < this.sources.length; i++) {
            chunk.push(this.sources[i].ip);
            if (chunk.length >= chunkSize || i === this.sources.length - 1) {
                const batchResponse = await fetch("ips/dns/batch", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(chunk)
                });
                const batchResult = await batchResponse.json();
                for (let i = 0; i < chunk.length; i++) {
                    this.sources[startOffset + i].dns = batchResult[i];
                }
                startOffset += chunk.length;
                chunk = [];
                this.requestUpdate();
            }
        }
    }

    issueLabel(issue) {
        return ISSUE_LABELS[issue] ?? issue;
    }

    typeLabel(type) {
        return TYPE_LABELS[type] ?? type;
    }

    dnsText(dns) {
        if (dns === undefined) {
            return "";
        } else if (dns === null) {
            return "n/a";
        } else {
            return dns;
        }
    }

    columns() {
        return [
            { key: "ip", value: s => s.ip },
            { key: "dns", thClass: "md-hidden", value: s => this.dnsText(s.dns) },
            { key: "count", value: s => s.count },
            { key: "domain", thClass: "sm-hidden", value: s => s.domain },
            { key: "types", thClass: "sm-hidden", value: s => s.types.map(t => this.typeLabel(t)) },
            { key: "issues", thClass: "xs-hidden", value: s => s.issues.map(i => this.issueLabel(i)) },
        ];
    }

    onFilterChange(key, value) {
        const next = { ...this.filterState };
        if (value) {
            next[key] = value;
        } else {
            delete next[key];
        }
        this.filterState = next;
    }

    onCountFilterChange(event) {
        this.countFilter = event.target.value;
    }

    countMatches(count) {
        const filter = COUNT_FILTERS.find(f => f.value === this.countFilter);
        return filter ? filter.test(count) : true;
    }

    prepareIssueBadges(issues) {
        // Sort to always have the same badge order
        issues.sort();

        // Convert to nice badges with tool tips
        return issues.map(issue =>
            html`<span class="badge badge-negative">${this.issueLabel(issue)}</span> `
        );
    }

    prepareTypesBadges(source) {
        // Sort to always have the same badge order
        source.types.sort();

        // Convert to nice bades with tool tips
        return source.types.map(type => {
            if (type === "Tls") {
                return html`<a class="button sm help" href="#/tls-reports?ip=${encodeURIComponent(source.ip)}" title="Show all SMTP TLS reports for this IP">SMTP TLS</a> `;
            } else if (type === "Dmarc") {
                return html`<a class="button sm help" href="#/dmarc-reports?ip=${encodeURIComponent(source.ip)}" title="Show all DMARC reports for this IP">DMARC</a> `;
            }
        })
    }

    prepareDnsName(dnsName) {
        if (dnsName === undefined) {
            return html`<span class="faded">loading...</span>`;
        } else if (dnsName === null) {
            return html`<span class="faded">n/a</span>`;
        } else {
            return dnsName;
        }
    }

    render() {
        const columns = this.columns();
        const rows = this.sources
            .filter(source => rowMatchesFilters(source, columns, this.filterState))
            .filter(source => this.countMatches(source.count));
        return html`
            <h1>Mail Sources: ${rows.length}</h1>
            <div>
                ${this.filtered ?
                    html`Filter active! <a class="ml button" href="#/sources">Show all Sources</a>` :
                    html`Filters: <a class="ml button" href="#/sources?issues=true">Only Sources with Issues</a>
                    <a class="ml button" href="#/sources?type=Dmarc">Only Sources from DMARC Reports</a>
                    <a class="ml button" href="#/sources?type=Tls">Only Sources from SMTP TLS Reports</a>`
                }
            </div>
            <div class="filter-toolbar">
                <div class="filter-group">
                    <span class="filter-label">Count:</span>
                    <select @change="${this.onCountFilterChange}">
                        ${COUNT_FILTERS.map(filter => html`
                            <option value="${filter.value}" ?selected="${this.countFilter === filter.value}">
                                ${filter.label}
                            </option>
                        `)}
                    </select>
                </div>
            </div>
            <table>
                <tr>
                    <th>IP Address</th>
                    <th class="md-hidden">DNS Name</th>
                    <th class="help" title="Number of records from reports for this IP">Count</th>
                    <th class="sm-hidden">Domain</th>
                    <th class="sm-hidden help" title="Report Types">Types</th>
                    <th class="xs-hidden help" title="Issues detected in reports from this IP">Issues</th>
                </tr>
                ${renderColumnFilterRow(this.sources, columns, this.filterState, (k, v) => this.onFilterChange(k, v))}
                ${rows.length !== 0 ? rows.map((source) =>
                    html`<tr>
                        <td>${source.ip}</td>
                        <td class="md-hidden">${this.prepareDnsName(source.dns)}</td>
                        <td>${source.count}</td>
                        <td class="sm-hidden"><a href="#/sources?domain=${encodeURIComponent(source.domain)}">${source.domain}</a></td>
                        <td class="sm-hidden">${this.prepareTypesBadges(source)}</td>
                        <td class="xs-hidden">${this.prepareIssueBadges(source.issues)}</td>
                    </tr>`
                ) : html`<tr>
                        <td colspan="6">No sources found.</td>
                    </tr>`
            }
            </table>
        `;
    }
}

customElements.define("drv-sources", Sources);
