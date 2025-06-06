import type { Step } from "../../env";

export const SetupSteps: Step[] = [
    {
        id: 'dest',
        optional: false,
    },
    {
        id: 'env',
        optional: true,
    },
    {
        id: 'ext-tools',
        optional: true,
    },
    {
        id: 'instance',
        optional: false,
    },
    {
        id: 'mods',
        optional: true,
    },
];