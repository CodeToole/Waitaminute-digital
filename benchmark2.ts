import { performance } from 'perf_hooks';

const ITERATIONS = 10000000;

function runBaseline() {
    let dummy = "";
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        // Map interestTag to Audience ID
        const AUDIENCE_MAP: Record<string, string> = {
            "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
            "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
            "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
        };
        const WAAS_LEADS_AUDIENCE_ID = "adaa3729-2989-4815-97d2-017605a9f810";
        // prevent dead code elimination
        dummy = AUDIENCE_MAP[i % 2 === 0 ? "WaaS Engine" : "Digital Strategy"];
    }
    const end = performance.now();
    return { time: end - start, dummy };
}

const AUDIENCE_MAP_GLOBAL: Record<string, string> = {
    "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
    "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
    "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
};
const WAAS_LEADS_AUDIENCE_ID_GLOBAL = "adaa3729-2989-4815-97d2-017605a9f810";

function runOptimized() {
    let dummy = "";
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
        dummy = AUDIENCE_MAP_GLOBAL[i % 2 === 0 ? "WaaS Engine" : "Digital Strategy"];
    }
    const end = performance.now();
    return { time: end - start, dummy };
}

const baselineResult = runBaseline();
const optimizedResult = runOptimized();

console.log(`Baseline time: ${baselineResult.time.toFixed(2)} ms`);
console.log(`Optimized time: ${optimizedResult.time.toFixed(2)} ms`);
console.log(`Improvement: ${((baselineResult.time - optimizedResult.time) / baselineResult.time * 100).toFixed(2)}%`);
