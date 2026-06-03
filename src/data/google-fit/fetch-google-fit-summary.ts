type GoogleFitAggregateResponse = {
  bucket?: {
    startTimeMillis?: string;
    dataset?: {
      point?: {
        value?: {
          intVal?: number;
          fpVal?: number;
        }[];
      }[];
    }[];
  }[];
};

export type GoogleFitSummary = {
  steps: number;
  calories: number;
  heartRate?: number;
  distanceMeters?: number;
};

function sumValues(
  dataset: NonNullable<NonNullable<NonNullable<GoogleFitAggregateResponse["bucket"]>[0]["dataset"]>[0]>,
  valueIndex: number,
  valueType: "int" | "fp",
): number {
  if (!dataset.point) return 0;
  return dataset.point.reduce((sum, point) => {
    const raw = point.value?.[valueIndex];
    if (!raw) return sum;
    const val = valueType === "int" ? (raw.intVal ?? 0) : (raw.fpVal ?? 0);
    return sum + Math.max(0, val);
  }, 0);
}

async function aggregateSingle(
  accessToken: string,
  startTimeMillis: number,
  endTimeMillis: number,
  dataTypeNames: string[],
): Promise<GoogleFitAggregateResponse | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aggregateBy: dataTypeNames.map((name) => ({ dataTypeName: name })),
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        }),
      },
    );
    if (!response.ok) {
      const errText = await response.text();
      console.log(`❌ Google Fit error (${dataTypeNames}):`, response.status, errText.slice(0, 200));
      return null;
    }
    return response.json() as Promise<GoogleFitAggregateResponse>;
  } catch {
    return null;
  }
}

export async function fetchGoogleFitSummary(params: {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
}): Promise<GoogleFitSummary | null> {
  const { accessToken, startTimeMillis, endTimeMillis } = params;
  const rangeMs = endTimeMillis - startTimeMillis;

  const [stepsRes, calRes, distRes] = await Promise.all([
    aggregateSingle(accessToken, startTimeMillis, endTimeMillis, ["com.google.step_count.delta"]),
    aggregateSingle(accessToken, startTimeMillis, endTimeMillis, ["com.google.calories.expended"]),
    aggregateSingle(accessToken, startTimeMillis, endTimeMillis, ["com.google.distance.delta"]),
  ]);

  const stepsDataset = stepsRes?.bucket?.[0]?.dataset?.[0];
  const calDataset = calRes?.bucket?.[0]?.dataset?.[0];
  const distDataset = distRes?.bucket?.[0]?.dataset?.[0];

  const steps = stepsDataset ? sumValues(stepsDataset, 0, "int") : 0;
  const calories = calDataset ? Math.round(sumValues(calDataset, 0, "fp")) : 0;
  const distanceMeters = distDataset ? Math.round(sumValues(distDataset, 0, "fp")) || undefined : undefined;

  console.log("📊 GF summary:", { steps, calories, distanceMeters, rangeMs });

  if (stepsDataset === undefined && calDataset === undefined && distDataset === undefined) {
    return null;
  }

  return { steps, calories, distanceMeters };
}

export type DailyStat = {
  date: string;
  steps: number;
  calories: number;
};

async function fetchGoogleFitDailyBuckets(
  accessToken: string,
  startTimeMillis: number,
  endTimeMillis: number,
): Promise<{ totalSteps: number; totalCalories: number; distanceMeters: number; days: DailyStat[] } | null> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: "com.google.step_count.delta" },
            { dataTypeName: "com.google.calories.expended" },
            { dataTypeName: "com.google.distance.delta" },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis,
        }),
      },
    );

    console.log(`📊 GF daily buckets - status:${response.status} range:${startTimeMillis}-${endTimeMillis}`);

    if (!response.ok) return null;

    const data = (await response.json()) as GoogleFitAggregateResponse;
    const buckets = data.bucket ?? [];
    let totalSteps = 0;
    let totalCalories = 0;
    let totalDistance = 0;
    const days: DailyStat[] = [];

    for (const bucket of buckets) {
      const datasets = bucket.dataset ?? [];
      const daySteps = datasets[0] ? sumValues(datasets[0], 0, "int") : 0;
      const dayCalories = datasets[1] ? Math.round(sumValues(datasets[1], 0, "fp")) : 0;
      const dayDistance = datasets[2] ? Math.round(sumValues(datasets[2], 0, "fp")) : 0;
      const bucketStart = bucket.startTimeMillis
        ? new Date(Number(bucket.startTimeMillis))
        : new Date();
      const y = bucketStart.getFullYear();
      const m = String(bucketStart.getMonth() + 1).padStart(2, "0");
      const d = String(bucketStart.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;

      totalSteps += daySteps;
      totalCalories += dayCalories;
      totalDistance += dayDistance;
      if (daySteps > 0 || dayCalories > 0) {
        days.push({ date: dateStr, steps: daySteps, calories: dayCalories });
      }
    }

    console.log(`📊 GF daily buckets - buckets:${buckets.length} total:${totalSteps}`);

    return { totalSteps, totalCalories, distanceMeters: totalDistance, days };
  } catch {
    return null;
  }
}

export async function fetchGoogleFitStatsRange(params: {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
}): Promise<{ totalSteps: number; totalCalories: number; distanceMeters: number; days: DailyStat[] } | null> {
  const { accessToken, startTimeMillis, endTimeMillis } = params;
  const rangeMs = endTimeMillis - startTimeMillis;

  if (rangeMs < 2 * 86400000) {
    const summary = await fetchGoogleFitSummary(params);
    console.log(`📊 GF stats range short path - summary:`, summary);
    if (!summary) return null;
    const d = new Date(startTimeMillis);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      totalSteps: summary.steps,
      totalCalories: summary.calories,
      distanceMeters: summary.distanceMeters ?? 0,
      days: [{ date: dateStr, steps: summary.steps, calories: summary.calories }],
    };
  }

  const MAX_CHUNK_MS = 55 * 86400000;
  if (rangeMs > MAX_CHUNK_MS) {
    console.log(`📊 GF stats range chunked - ${Math.ceil(rangeMs / MAX_CHUNK_MS)} chunks`);
    let totalSteps = 0;
    let totalCalories = 0;
    let totalDistance = 0;
    const allDays: DailyStat[] = [];
    let chunkStart = startTimeMillis;

    while (chunkStart < endTimeMillis) {
      const chunkEnd = Math.min(chunkStart + MAX_CHUNK_MS, endTimeMillis);
      const chunkResult = await fetchGoogleFitDailyBuckets(accessToken, chunkStart, chunkEnd);
      if (chunkResult === null) return null;
      totalSteps += chunkResult.totalSteps;
      totalCalories += chunkResult.totalCalories;
      totalDistance += chunkResult.distanceMeters;
      allDays.push(...chunkResult.days);
      chunkStart = chunkEnd;
    }

    return { totalSteps, totalCalories, distanceMeters: totalDistance, days: allDays };
  }

  console.log(`📊 GF stats range single - startMs:${startTimeMillis} endMs:${endTimeMillis}`);
  return fetchGoogleFitDailyBuckets(accessToken, startTimeMillis, endTimeMillis);
}
