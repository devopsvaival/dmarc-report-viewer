import { html } from "lit";

export function join(elements, joiner) {
    return elements.flatMap(x => [joiner, x]).slice(1);
}

/**
 * Collect the sorted, distinct values of a single column across all rows.
 * The extractor may return a scalar or an array (for multi-value columns).
 * Empty, null and undefined values are ignored.
 *
 * @param {Array<object>} rows
 * @param {(row: object) => (string|number|Array<string|number>)} extractor
 * @returns {Array<string>}
 */
export function distinctColumnValues(rows, extractor) {
    const values = new Set();
    for (const row of rows) {
        const raw = extractor(row);
        const list = Array.isArray(raw) ? raw : [raw];
        for (const value of list) {
            if (value !== undefined && value !== null && value !== "") {
                values.add(String(value));
            }
        }
    }
    return [...values].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
}

/**
 * Check whether a row passes every active column filter.
 * A column with no selected value ("All") is ignored.
 *
 * @param {object} row
 * @param {Array<{key: string, value: (row: object) => any}>} columns
 * @param {Object<string, string>} filterState
 * @returns {boolean}
 */
export function rowMatchesFilters(row, columns, filterState) {
    for (const column of columns) {
        const selected = filterState[column.key];
        if (!selected) {
            continue;
        }
        const raw = column.value(row);
        if (Array.isArray(raw)) {
            if (!raw.map(String).includes(selected)) {
                return false;
            }
        } else if (String(raw) !== selected) {
            return false;
        }
    }
    return true;
}

/**
 * Render a table filter row with one dropdown per column.
 * Dropdown options are always computed from the full (unfiltered) row set so
 * that filtering one column never hides the choices of the others.
 *
 * @param {Array<object>} allRows Unfiltered rows used to build the options
 * @param {Array<{key: string, thClass?: string, value: (row: object) => any}>} columns
 * @param {Object<string, string>} filterState
 * @param {(key: string, value: string) => void} onChange
 */
export function renderColumnFilterRow(allRows, columns, filterState, onChange) {
    return html`
        <tr>
            ${columns.map(column => html`
                <th class="filter ${column.thClass ?? ""}">
                    <select @change="${e => onChange(column.key, e.target.value)}">
                        <option value="" ?selected=${!filterState[column.key]}>All</option>
                        ${distinctColumnValues(allRows, column.value).map(value => html`
                            <option value="${value}" ?selected=${filterState[column.key] === value}>${value}</option>
                        `)}
                    </select>
                </th>
            `)}
        </tr>
    `;
}
