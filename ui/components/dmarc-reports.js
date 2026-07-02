import { LitElement, html } from "lit";
import { globalStyle, reportsFilterStyle } from "../style.js";
import { dateToUnix, quickRangeDates, renderDateRangeGroup } from "../date-filter.js";

const RECORD_THRESHOLDS = [
    { value: 0, label: "Any" },
    { value: 5, label: "Greater than 5" },
    { value: 10, label: "Greater than 10" },
];

export class DmarcReports extends LitElement {
    static styles = [globalStyle, reportsFilterStyle];

    static properties = {
        params: { type: Object },
        reports: { type: Array },
        beginDate: { type: String },
        endDate: { type: String },
        recordsGt: { type: Number },
        activeRange: { type: Number },
    };

    constructor() {
        super();
        this.params = {};
        this.reports = [];
        this.filtered = false;
        this.beginDate = "";
        this.endDate = "";
        this.recordsGt = 0;
        this.activeRange = 0;
    }

    updated(changedProperties) {
        if (changedProperties.has("params")) {
            this.updateReports();
        }
    }

    applyQuickRange(days) {
        const { begin, end } = quickRangeDates(days);
        this.beginDate = begin;
        this.endDate = end;
        this.activeRange = days;
        this.updateReports();
    }

    onBeginInput(event) {
        this.beginDate = event.target.value;
        this.activeRange = 0;
        this.updateReports();
    }

    onEndInput(event) {
        this.endDate = event.target.value;
        this.activeRange = 0;
        this.updateReports();
    }

    onRecordsChange(event) {
        this.recordsGt = Number(event.target.value) || 0;
        this.updateReports();
    }

    clearQuickFilters() {
        this.beginDate = "";
        this.endDate = "";
        this.recordsGt = 0;
        this.activeRange = 0;
        this.updateReports();
    }

    get hasQuickFilters() {
        return Boolean(this.beginDate) || Boolean(this.endDate) || this.recordsGt > 0;
    }

    async updateReports() {
        const urlParams = [];
        if (this.params.flagged === "true" || this.params.flagged === "false") {
            urlParams.push("flagged=" + this.params.flagged);
        }
        if (this.params.flagged_dkim === "true" || this.params.flagged_dkim === "false") {
            urlParams.push("flagged_dkim=" + this.params.flagged_dkim);
        }
        if (this.params.flagged_spf === "true" || this.params.flagged_spf === "false") {
            urlParams.push("flagged_spf=" + this.params.flagged_spf);
        }
        if (this.params.flagged_dmarc === "true" || this.params.flagged_dmarc === "false") {
            urlParams.push("flagged_dmarc=" + this.params.flagged_dmarc);
        }
        if (this.params.domain) {
            urlParams.push("domain=" + encodeURIComponent(this.params.domain));
        }
        if (this.params.org) {
            urlParams.push("org=" + encodeURIComponent(this.params.org));
        }
        if (this.params.ip) {
            urlParams.push("ip=" + encodeURIComponent(this.params.ip));
        }

        // Route-driven filters decide whether the "Show all Reports" hint appears.
        const routeFiltered = urlParams.length > 0;

        const beginUnix = dateToUnix(this.beginDate, false);
        const endUnix = dateToUnix(this.endDate, true);
        if (beginUnix !== null) {
            urlParams.push("begin=" + beginUnix);
        }
        if (endUnix !== null) {
            urlParams.push("end=" + endUnix);
        }
        if (this.recordsGt > 0) {
            urlParams.push("records_gt=" + this.recordsGt);
        }

        let url = "dmarc-reports";
        if (urlParams.length > 0) {
            url += "?" + urlParams.join("&");
        }
        const response = await fetch(url);
        this.reports = await response.json();
        this.reports.sort((a, b) => b.date_begin - a.date_begin);
        this.filtered = routeFiltered;
    }

    renderQuickFilters() {
        return html`
            <div class="filter-toolbar">
                ${renderDateRangeGroup({
                    activeRange: this.activeRange,
                    beginDate: this.beginDate,
                    endDate: this.endDate,
                    onQuickRange: days => this.applyQuickRange(days),
                    onBeginInput: e => this.onBeginInput(e),
                    onEndInput: e => this.onEndInput(e),
                })}
                <div class="filter-group">
                    <span class="filter-label">Records:</span>
                    <select @change="${this.onRecordsChange}">
                        ${RECORD_THRESHOLDS.map(threshold => html`
                            <option value="${threshold.value}" ?selected="${this.recordsGt === threshold.value}">
                                ${threshold.label}
                            </option>
                        `)}
                    </select>
                    ${this.hasQuickFilters ? html`
                        <button class="button sm" @click="${this.clearQuickFilters}">Clear</button>
                    ` : ""}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <h1>DMARC Reports: ${this.reports.length}</h1>
            <div>
                ${this.filtered ?
                    html`Filter active! <a class="ml button" href="#/dmarc-reports">Show all Reports</a>` :
                    html`Filters:
                        <a class="button mr-5" href="#/dmarc-reports?flagged=true">Reports with Problems</a>
                        <a class="button mr-5" href="#/dmarc-reports?flagged_dkim=true">Reports with DKIM Problems</a>
                        <a class="button mr-5" href="#/dmarc-reports?flagged_spf=true">Reports with SPF Problems</a>
                        <a class="button" href="#/dmarc-reports?flagged_dmarc=true">Reports with DMARC Problems</a>
                    `
                }
            </div>
            ${this.renderQuickFilters()}
            <drv-dmarc-report-table .reports="${this.reports}"></drv-dmarc-report-table>
        `;
    }
}

customElements.define("drv-dmarc-reports", DmarcReports);
