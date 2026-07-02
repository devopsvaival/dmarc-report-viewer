import { LitElement, html } from "lit";
import { globalStyle } from "../style.js";
import { renderColumnFilterRow, rowMatchesFilters } from "../utils.js";

export class MailTable extends LitElement {
    static styles = [globalStyle];

    static properties = {
        mails: { type: Array },
        filterState: { type: Object },
    };

    constructor() {
        super();
        this.mails = [];
        this.filterState = {};
    }

    updated(changedProperties) {
        // Reset column filters whenever a new set of mails is loaded
        if (changedProperties.has("mails") && Object.keys(this.filterState).length > 0) {
            this.filterState = {};
        }
    }

    prepareSubject(subject) {
        subject = subject.replace(/Report Domain: |Report domain: /, "D: ");
        subject = subject.replace(/Submitter: /, "S: ");
        subject = subject.replace(/Report-ID: /, "ID: ");
        subject = subject.replace(/T00\.00\.00Z/, "");

        const limit = 70;
        if (subject.length <= limit) {
            return subject;
        } else {
            return subject.substring(0, limit) + "...";
        }
    }

    prepareSize(mail) {
        if (mail.oversized) {
            return html`<span class="badge badge-negative">${mail.size}</span>`;
        } else {
            return mail.size;
        }
    }

    reportTypeText(mail) {
        if (mail.oversized) {
            return "n/a";
        } else if (mail.xml_files < 1 && mail.json_files < 1) {
            return "None";
        } else {
            const files = [];
            if (mail.xml_files > 0) files.push("DMARC");
            if (mail.json_files > 0) files.push("TLS");
            return files.join(", ");
        }
    }

    duplicatesText(mail) {
        if (mail.oversized) {
            return "n/a";
        } else if (mail.dmarc_duplicates.length > 0 || mail.tls_duplicates.length) {
            return "Yes";
        } else {
            return "No";
        }
    }

    parsingErrorText(mail) {
        if (mail.oversized) {
            return "n/a";
        } else if (mail.xml_parsing_errors > 0 || mail.json_parsing_errors > 0) {
            return "Yes";
        } else {
            return "No";
        }
    }

    columns() {
        return [
            { key: "subject", value: m => this.prepareSubject(m.subject) },
            { key: "sender", thClass: "sm-hidden", value: m => m.sender },
            { key: "date", thClass: "md-hidden", value: m => new Date(m.date * 1000).toLocaleString() },
            { key: "size", thClass: "xs-hidden", value: m => m.size },
            { key: "type", thClass: "md-hidden", value: m => this.reportTypeText(m) },
            { key: "duplicates", thClass: "lg-hidden", value: m => this.duplicatesText(m) },
            { key: "errors", thClass: "xs-hidden", value: m => this.parsingErrorText(m) },
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

    prepareReportType(mail) {
        const text = this.reportTypeText(mail);
        if (text === "n/a") {
            return html`<span class="faded">n/a</span>`;
        } else if (text === "None") {
            return html`<span class="badge badge-negative">None</span>`;
        } else {
            return html`<span class="faded">${text}</span>`;
        }
    }

    prepareParsingError(mail) {
        const text = this.parsingErrorText(mail);
        if (text === "Yes") {
            return html`<span class="badge badge-negative">Yes</span>`;
        } else if (text === "No") {
            return html`<span class="faded">No</span>`;
        } else {
            return html`<span class="faded">n/a</span>`;
        }
    }

    prepareDuplicates(mail) {
        const text = this.duplicatesText(mail);
        if (text === "Yes") {
            return html`<span class="badge badge-warning">Yes</span>`;
        } else if (text === "No") {
            return html`<span class="faded">No</span>`;
        } else {
            return html`<span class="faded">n/a</span>`;
        }
    }

    render() {
        const columns = this.columns();
        const rows = this.mails.filter(mail => rowMatchesFilters(mail, columns, this.filterState));
        return html`
            <table>
                <tr>
                    <th class="help" title="Subject might be incomplete! Check details for full mail subject.">Subject</th>
                    <th class="sm-hidden">Sender</th>
                    <th class="md-hidden">Date</th>
                    <th class="xs-hidden help" title="Size of E-Mail in Bytes">Size</th>
                    <th class="md-hidden help" title="Type of reports in the Mail">Type</th>
                    <th class="lg-hidden help" title="Duplicated reports found in Mail?">Duplicates</th>
                    <th class="xs-hidden help" title="Did the mail cause parsing errors?">Errors</th>
                </tr>
                ${renderColumnFilterRow(this.mails, columns, this.filterState, (k, v) => this.onFilterChange(k, v))}
                ${rows.length !== 0 ? rows.map((mail) =>
                    html`<tr>
                        <td><a href="#/mails/${mail.id}">${this.prepareSubject(mail.subject)}</a></td>
                        <td class="sm-hidden"><a href="#/mails?sender=${encodeURIComponent(mail.sender)}">${mail.sender}</a></td>
                        <td class="md-hidden">${new Date(mail.date * 1000).toLocaleString()}</td>
                        <td class="xs-hidden">${this.prepareSize(mail)}</td>
                        <td class="md-hidden">${this.prepareReportType(mail)}</td>
                        <td class="lg-hidden">${this.prepareDuplicates(mail)}</td>
                        <td class="xs-hidden">${this.prepareParsingError(mail)}</td>
                    </tr>`
                ) : html`<tr>
                        <td colspan="6">No mails found.</td>
                    </tr>`
                }
            </table>
        `;
    }
}

customElements.define("drv-mail-table", MailTable);
