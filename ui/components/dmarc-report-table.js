import { LitElement, html } from "lit";
import { globalStyle } from "../style.js";
import { renderColumnFilterRow, rowMatchesFilters } from "../utils.js";

export class DmarcReportTable extends LitElement {
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
        const limit = 25;
        if (id.length <= limit) {
            return id;
        } else {
            return id.substring(0, limit) + "...";
        }
    }

    problemText(report) {
        const problems = [];
        if (report.flagged_dkim) problems.push("DKIM");
        if (report.flagged_spf) problems.push("SPF");
        if (report.flagged_dmarc) problems.push("DMARC");
        return problems.length !== 0 ? problems.join(", ") : "None";
    }

    columns() {
        return [
            { key: "id", value: r => r.id },
            { key: "org", thClass: "xs-hidden", value: r => r.org },
            { key: "domain", thClass: "sm-hidden", value: r => r.domain },
            { key: "problems", value: r => this.problemText(r) },
            { key: "records", thClass: "sm-hidden", value: r => r.records },
            { key: "begin", thClass: "md-hidden", value: r => new Date(r.date_begin * 1000).toLocaleString() },
            { key: "end", thClass: "md-hidden", value: r => new Date(r.date_end * 1000).toLocaleString() },
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

    renderProblemBadges(dkim, spf, dmarc) {
        const badges = [];
        if (dkim) {
            badges.push(html`<span class="help badge badge-negative mr-5" title="This report failed the DKIM policy evaluation or the DKIM authentication did not pass">DKIM</span>`);
        }
        if (spf) {
            badges.push(html` <span class="help badge badge-negative" title="This report failed the SPF policy evaluation or the SPF authentication did not pass">SPF</span>`);
        }
        if (dmarc) {
            badges.push(html` <span class="help badge badge-negative" title="This report failed the SPF and DKIM policy evaluation">DMARC</span>`);
        }
        return badges;
    }

    render() {
        const columns = this.columns();
        const rows = this.reports.filter(report => rowMatchesFilters(report, columns, this.filterState));
        return html`
            <table>
                <tr>
                    <th class="help" title="Report ID, might be incomplete! Check details for full report ID.">ID</th>
                    <th class="xs-hidden">Organization</th>
                    <th class="sm-hidden">Domain</th>
                    <th class="help" title="Reports with SPF or DKIM problems are highlighted in red">Problems</th>
                    <th class="sm-hidden">Records</th>
                    <th class="md-hidden">Begin</th>
                    <th class="md-hidden">End</th>
                </tr>
                ${renderColumnFilterRow(this.reports, columns, this.filterState, (k, v) => this.onFilterChange(k, v))}
                ${rows.length !== 0 ? rows.map((report) =>
                    html`<tr>
                            <td><a href="#/dmarc-reports/${report.hash}" title="${report.id}">${this.prepareId(report.id)}</a></td>
                            <td class="xs-hidden"><a href="#/dmarc-reports?org=${encodeURIComponent(report.org)}">${report.org}</a></td>
                            <td class="sm-hidden"><a href="#/dmarc-reports?domain=${encodeURIComponent(report.domain)}">${report.domain}</a></td>
                            <td>${this.renderProblemBadges(report.flagged_dkim, report.flagged_spf, report.flagged_dmarc)}</td>
                            <td class="sm-hidden">${report.records}</td>
                            <td class="md-hidden">${new Date(report.date_begin * 1000).toLocaleString()}</td>
                            <td class="md-hidden">${new Date(report.date_end * 1000).toLocaleString()}</td>
                        </tr>`

                ) : html`<tr>
                            <td colspan="7">No reports found.</td>
                        </tr>`
                }
            </table>
        `;
    }
}

customElements.define("drv-dmarc-report-table", DmarcReportTable);
