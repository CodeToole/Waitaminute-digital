const ITERATIONS = 10000000;

function runBaseline() {
    let dummy = "";
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITERATIONS; i++) {
        // Map interestTag to Audience ID
        const AUDIENCE_MAP: Record<string, string> = {
            "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
            "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
            "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
        };
        const WAAS_LEADS_AUDIENCE_ID = "adaa3729-2989-4815-97d2-017605a9f810";
        // prevent dead code elimination
        const tag = i % 2 === 0 ? "WaaS Engine" : "Digital Strategy";
        const audienceId = (tag && AUDIENCE_MAP[tag as string]) ? AUDIENCE_MAP[tag as string] : WAAS_LEADS_AUDIENCE_ID;
        dummy = audienceId;
    }
    const end = process.hrtime.bigint();
    return { time: Number(end - start) / 1000000, dummy };
}

const AUDIENCE_MAP_GLOBAL: Record<string, string> = {
    "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
    "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
    "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
};
const WAAS_LEADS_AUDIENCE_ID_GLOBAL = "adaa3729-2989-4815-97d2-017605a9f810";

function runOptimized() {
    let dummy = "";
    const start = process.hrtime.bigint();
    for (let i = 0; i < ITERATIONS; i++) {
        const tag = i % 2 === 0 ? "WaaS Engine" : "Digital Strategy";
        const audienceId = (tag && AUDIENCE_MAP_GLOBAL[tag as string]) ? AUDIENCE_MAP_GLOBAL[tag as string] : WAAS_LEADS_AUDIENCE_ID_GLOBAL;
        dummy = audienceId;
    }
    const end = process.hrtime.bigint();
    return { time: Number(end - start) / 1000000, dummy };
}

// Run benchmark multiple times and average to get more stable results
const numRuns = 5;
let totalBaselineTime = 0;
let totalOptimizedTime = 0;

for (let r = 0; r < numRuns; r++) {
    const baselineResult = runBaseline();
    const optimizedResult = runOptimized();
    totalBaselineTime += baselineResult.time;
    totalOptimizedTime += optimizedResult.time;
}

const avgBaselineTime = totalBaselineTime / numRuns;
const avgOptimizedTime = totalOptimizedTime / numRuns;

console.log(`Average Baseline time: ${avgBaselineTime.toFixed(2)} ms`);
console.log(`Average Optimized time: ${avgOptimizedTime.toFixed(2)} ms`);
console.log(`Average Improvement: ${((avgBaselineTime - avgOptimizedTime) / avgBaselineTime * 100).toFixed(2)}%`);
