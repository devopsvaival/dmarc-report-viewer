import { html } from "lit";

export const QUICK_RANGES = [
    { days: 3, label: "Last 3 Days" },
    { days: 7, label: "Last 7 Days" },
    { days: 14, label: "Last 14 Days (Fortnight)" },
];

/** Format a Date as a local yyyy-mm-dd string for <input type="date">. */
export function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/** Convert a yyyy-mm-dd local date string to Unix seconds (start or end of day). */
export function dateToUnix(dateStr, endOfDay = false) {
    if (!dateStr) {
        return null;
    }
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) {
        return null;
    }
    const date = endOfDay
        ? new Date(year, month - 1, day, 23, 59, 59, 999)
        : new Date(year, month - 1, day, 0, 0, 0, 0);
    return Math.floor(date.getTime() / 1000);
}

/**
 * Compute the begin/end yyyy-mm-dd strings for a quick range of N days.
 * The range includes today, so "Last 3 Days" spans today and the two prior days.
 *
 * @param {number} days
 * @returns {{begin: string, end: string}}
 */
export function quickRangeDates(days) {
    const end = new Date();
    const begin = new Date();
    begin.setDate(begin.getDate() - (days - 1));
    return { begin: formatDateInput(begin), end: formatDateInput(end) };
}

/**
 * Render the shared "Date range" filter group: quick-range buttons plus
 * manual Begin/End date inputs. State and callbacks are owned by the caller.
 *
 * @param {{
 *   activeRange: number,
 *   beginDate: string,
 *   endDate: string,
 *   onQuickRange: (days: number) => void,
 *   onBeginInput: (event: Event) => void,
 *   onEndInput: (event: Event) => void,
 * }} options
 */
export function renderDateRangeGroup({ activeRange, beginDate, endDate, onQuickRange, onBeginInput, onEndInput }) {
    return html`
        <div class="filter-group">
            <span class="filter-label">Date range:</span>
            ${QUICK_RANGES.map(range => html`
                <button
                    class="button sm ${activeRange === range.days ? "active" : ""}"
                    @click="${() => onQuickRange(range.days)}">
                    ${range.label}
                </button>
            `)}
            <label class="filter-inline">Begin
                <input type="date" .value="${beginDate}" @change="${onBeginInput}">
            </label>
            <label class="filter-inline">End
                <input type="date" .value="${endDate}" @change="${onEndInput}">
            </label>
        </div>
    `;
}
