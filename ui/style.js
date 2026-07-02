import { css } from "lit";

export const globalStyle = css`
    a {
        color: var(--link);
        text-decoration: none;
    }

    a:hover {
        color: var(--link-hover);
    }

    .badge {
        border-radius: 5px;
        padding-left: 6px;
        padding-right: 6px;
        padding-top: 1px;
        padding-bottom: 1px;
        font-size: 13px;
        font-weight: 600;
        background-color: var(--badge-bg);
        color: white;
    }

    .badge-negative {
        background-color: var(--negative);
    }

    .badge-positive {
        background-color: var(--positive);
    }

    .badge-warning {
        background-color: var(--warning);
        color: var(--warning-text);
    }

    .faded {
        color: var(--text-muted);
    }

    .help {
        cursor: help;
        text-decoration-line: underline;
        text-decoration-style: dotted;
    }

    table {
        width: 100%;
        margin-top: 15px;
        border-collapse: separate;
        border-spacing: 0;
        background-color: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
        box-shadow: var(--shadow);
    }

    th {
        color: var(--th-text);
        background-color: var(--th-bg);
        border-bottom: 1px solid var(--border-strong);
        text-align: left;
        font-weight: 700;
        font-size: 15px;
    }

    td {
        border-top: 1px solid var(--border);
    }

    tr:first-child th {
        border-top: none;
    }

    td, th {
        padding-left: 15px;
        padding-right: 15px;
        padding-top: 7px;
        padding-bottom: 7px;
    }

    tbody tr:last-child td {
        border-bottom: none;
    }

    tr:hover {
        background-color: var(--row-hover);
    }

    td.name {
        font-weight: 700;
        width: 175px;
        color: var(--text-muted);
    }

    th.filter {
        font-weight: 400;
        padding-top: 4px;
        padding-bottom: 7px;
        background-color: var(--th-bg);
    }

    th.filter select {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        font: inherit;
        font-size: 14px;
        font-weight: 400;
        color: var(--text);
        background-color: var(--surface);
        border: 1px solid var(--border-strong);
        border-radius: 5px;
        padding: 3px 4px;
    }

    th.filter select:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent);
    }

    h1, h2, h3 {
        padding: 0px;
        margin-top: 15px;
        margin-bottom: 15px;
        color: var(--text);
        font-weight: 700;
        letter-spacing: -0.01em;
    }

    h1 {
        margin-top: 0px;
        font-size: 28px;
    }

    .button {
        background: none;
        border: none;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        outline: inherit;
        display: inline-block;
        padding: 5px;
        padding-left: 10px;
        padding-right: 10px;
        margin-right: 10px;
        color: white;
        border-radius: 6px;
        background-color: var(--button-bg);
        margin-bottom: 3px;
        transition: background-color 0.15s ease;
    }

    .button:hover {
        color: white;
        background-color: var(--button-bg-hover);
    }

    .button.sm {
        padding: 1px;
        padding-left: 6px;
        padding-right: 6px;
        margin-right: 5px;
        font-size: 13px;
    }

    .ml {
        margin-left: 10px;
    }

    .sourceip .name {
        padding-left: 40px;
    }

    .mr-5 {
        margin-right: 5px;
    }

    @media only screen and (max-width: 1500px) {
        .lg-hidden {
            display: none;
        }
    }

    @media only screen and (max-width: 1100px) {
        .md-hidden {
            display: none;
        }
    }

    @media only screen and (max-width: 800px) {
        .sm-hidden {
            display: none;
        }
    }

    @media only screen and (max-width: 600px) {
        .xs-hidden {
            display: none;
        }
    }
`;
