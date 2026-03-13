import { performance } from 'perf_hooks';

const ITERATIONS = 10000000; // 10 million

function runBaseline() {
    let dummy;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        const AUDIENCE_MAP: Record<string, string> = {
            "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
            "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
            "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
        };
        const WAAS_LEADS_AUDIENCE_ID = "adaa3729-2989-4815-97d2-017605a9f810";
        dummy = AUDIENCE_MAP["WaaS Engine"];
    }
    const end = performance.now();
    return end - start;
}

const AUDIENCE_MAP_GLOBAL: Record<string, string> = {
    "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
    "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
    "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
};
const WAAS_LEADS_AUDIENCE_ID_GLOBAL = "adaa3729-2989-4815-97d2-017605a9f810";

function runOptimized() {
    let dummy;
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        dummy = AUDIENCE_MAP_GLOBAL["WaaS Engine"];
    }
    const end = performance.now();
    return end - start;
}

const baselineTime = runBaseline();
const optimizedTime = runOptimized();

console.log(`Baseline time: ${baselineTime.toFixed(2)} ms`);
console.log(`Optimized time: ${optimizedTime.toFixed(2)} ms`);
console.log(`Improvement: ${((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2)}%`);
