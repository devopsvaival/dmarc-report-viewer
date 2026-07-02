import { LitElement, html } from "lit";
import { globalStyle, reportsFilterStyle } from "../style.js";
import { dateToUnix, quickRangeDates, renderDateRangeGroup } from "../date-filter.js";

export class Mails extends LitElement {
    static styles = [globalStyle, reportsFilterStyle];

    static properties = {
        params: { type: Object },
        mails: { type: Array },
        beginDate: { type: String },
        endDate: { type: String },
        activeRange: { type: Number },
    };

    constructor() {
        super();
        this.params = {};
        this.mails = [];
        this.filtered = false;
        this.beginDate = "";
        this.endDate = "";
        this.activeRange = 0;
    }

    updated(changedProperties) {
        if (changedProperties.has("params")) {
            this.updateMails();
        }
    }

    applyQuickRange(days) {
        const { begin, end } = quickRangeDates(days);
        this.beginDate = begin;
        this.endDate = end;
        this.activeRange = days;
        this.updateMails();
    }

    onBeginInput(event) {
        this.beginDate = event.target.value;
        this.activeRange = 0;
        this.updateMails();
    }

    onEndInput(event) {
        this.endDate = event.target.value;
        this.activeRange = 0;
        this.updateMails();
    }

    clearQuickFilters() {
        this.beginDate = "";
        this.endDate = "";
        this.activeRange = 0;
        this.updateMails();
    }

    get hasQuickFilters() {
        return Boolean(this.beginDate) || Boolean(this.endDate);
    }

    async updateMails() {
        const queryParams = [];
        if (this.params.oversized === "true" || this.params.oversized === "false") {
            queryParams.push("oversized=" + this.params.oversized);
        }
        if (this.params.sender) {
            queryParams.push("sender=" + encodeURIComponent(this.params.sender));
        }
        if (this.params.attachment) {
            queryParams.push("attachment=" + encodeURIComponent(this.params.attachment));
        }
        if (this.params.errors === "true" || this.params.errors === "false") {
            queryParams.push("errors=" + this.params.errors);
        }
        if (this.params.duplicates === "true" || this.params.duplicates === "false") {
            queryParams.push("duplicates=" + this.params.duplicates);
        }

        // Route-driven filters decide whether the "Show all Mails" hint appears.
        const routeFiltered = queryParams.length > 0;

        const beginUnix = dateToUnix(this.beginDate, false);
        const endUnix = dateToUnix(this.endDate, true);
        if (beginUnix !== null) {
            queryParams.push("begin=" + beginUnix);
        }
        if (endUnix !== null) {
            queryParams.push("end=" + endUnix);
        }

        let url = "mails";
        if (queryParams.length > 0) {
            url += "?" + queryParams.join("&");
        }
        const mailsResponse = await fetch(url);
        this.mails = await mailsResponse.json();
        this.mails.sort((a, b) => b.date - a.date);
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
                ${this.hasQuickFilters ? html`
                    <div class="filter-group">
                        <button class="button sm" @click="${this.clearQuickFilters}">Clear</button>
                    </div>
                ` : ""}
            </div>
        `;
    }

    render() {
        return html`
            <h1>Mails: ${this.mails.length}</h1>
            <div>
                ${this.filtered ?
                    html`Filter active! <a class="ml button" href="#/mails">Show all Mails</a>` :
                    html`Filters: <a class="ml button" href="#/mails?oversized=true">Oversized Mails</a>
                         <a class="button" href="#/mails?attachment=dmarc&oversized=false">With DMARC</a>
                         <a class="button" href="#/mails?attachment=tls&oversized=false">With TLS</a>
                         <a class="button" href="#/mails?attachment=none&oversized=false">Without Files</a>
                         <a class="button" href="#/mails?duplicates=true">With Duplicates</a>
                         <a class="button" href="#/mails?errors=true">Parsing Errors</a>`
            }
            </div>
            ${this.renderQuickFilters()}
            <drv-mail-table .mails="${this.mails}"></drv-mail-table>
        `;
    }
}

customElements.define("drv-mails", Mails);
