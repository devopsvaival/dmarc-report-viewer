import { LitElement, html } from "lit";
import { globalStyle } from "../style.js";
import { join, renderColumnFilterRow, rowMatchesFilters } from "../utils.js";

export class TlsReportTable extends LitElement {
    static styles = [globalStyle];

    static properties = {
        reports: { type: Array },
        filterState: { type: Object },
    };

    constructor() {
        super();
        this.reports = [];
        this.filterState = {};
    }

    updated(changedProperties) {
        // Reset column filters whenever a new set of reports is loaded
        if (changedProperties.has("reports") && Object.keys(this.filterState).length > 0) {
            this.filterState = {};
        }
    }

    prepareId(id) {
        // Many reports contain a piece of the timestamp that is always the same,
        // lets remove it to save some screen space!
        const shortened = id.replace("T00:00:00Z", "");

        const limit = 25;
        if (shortened.length <= limit) {
            return shortened;
        } else {
            return shortened.substring(0, limit) + "...";
        }
    }

    problemText(report) {
        const problems = [];
        if (report.flagged_sts) problems.push("MTA-STS");
        if (report.flagged_tlsa) problems.push("TLSA");
        return problems.length !== 0 ? problems.join(", ") : "None";
    }

    columns() {
        return [
            { key: "id", value: r => r.id },
            { key: "org", thClass: "xs-hidden", value: r => r.org },
            { key: "domains", thClass: "sm-hidden", value: r => r.domains },
            { key: "problems", value: r => this.problemText(r) },
            { key: "records", thClass: "sm-hidden", value: r => r.records },
            { key: "begin", thClass: "md-hidden", value: r => new Date(r.date_begin).toLocaleString() },
            { key: "end", thClass: "md-hidden", value: r => new Date(r.date_end).toLocaleString() },
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

    renderProblemBadges(sts, tlsa) {
        const badges = [];
        if (sts) {
            badges.push(html`<span class="badge badge-negative">MTA-STS</span>`);
        }
        if (tlsa) {
            badges.push(html`<span class="badge badge-negative">TLSA</span>`);
        }
        return join(badges, html` `);
    }

    renderDomains(domains) {
        if (domains.length === 0) {
            return html`<span class="faded">No domains</span>`;
        }
        const links = domains.map(
            d => html`<a href="#/tls-reports?domain=${encodeURIComponent(d)}">${d}</a>`
        );
        return join(links, html`, `);
    }

    render() {
        const columns = this.columns();
        const rows = this.reports.filter(report => rowMatchesFilters(report, columns, this.filterState));
        return html`
            <table>
                <tr>
                    <th class="help" title="Report ID, might be incomplete! Check details for full report ID.">ID</th>
                    <th class="xs-hidden">Organization</th>
                    <th class="sm-hidden">Domains</th>
                    <th class="help" title="Reports with MTA-STS or TLSA problems are highlighted in red">Problems</th>
                    <th class="sm-hidden">Policies</th>
                    <th class="md-hidden">Begin</th>
                    <th class="md-hidden">End</th>
                </tr>
                ${renderColumnFilterRow(this.reports, columns, this.filterState, (k, v) => this.onFilterChange(k, v))}
                ${rows.length !== 0 ? rows.map((report) =>
                    html`<tr>
                            <td><a href="#/tls-reports/${report.hash}" title="${report.id}">${this.prepareId(report.id)}</a></td>
                            <td class="xs-hidden"><a href="#/tls-reports?org=${encodeURIComponent(report.org)}">${report.org}</a></td>
                            <td class="sm-hidden">${this.renderDomains(report.domains)}</td>
                            <td>${this.renderProblemBadges(report.flagged_sts, report.flagged_tlsa)}</td>
                            <td class="sm-hidden">${report.records}</td>
                            <td class="md-hidden">${new Date(report.date_begin).toLocaleString()}</td>
                            <td class="md-hidden">${new Date(report.date_end).toLocaleString()}</td>
                        </tr>`

                ) : html`<tr>
                            <td colspan="7">No reports found.</td>
                        </tr>`
                }
            </table>
        `;
    }
}

customElements.define("drv-tls-report-table", TlsReportTable);
