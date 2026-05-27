type GoogleFitAggregateResponse = {
  bucket?: {
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
}): Promise<GoogleFitSummary> {
  const { accessToken, startTimeMillis, endTimeMillis } = params;

  const [mainResult, distanceResult] = await Promise.all([
    aggregateSingle(accessToken, startTimeMillis, endTimeMillis, [
      "com.google.step_count.delta",
      "com.google.calories.expended",
    ]),
    aggregateSingle(accessToken, startTimeMillis, endTimeMillis, [
      "com.google.distance.delta",
    ]),
  ]);

  // Parse steps + calories
  let steps = 0;
  let calories = 0;
  const mainDatasets = mainResult?.bucket?.[0]?.dataset;
  if (mainDatasets && mainDatasets.length >= 2) {
    steps = sumValues(mainDatasets[0], 0, "int");
    calories = Math.round(sumValues(mainDatasets[1], 0, "fp"));
  }
  console.log("📥 Datasets:", mainDatasets?.length,
    mainDatasets?.[0]?.point?.[0]?.value ? JSON.stringify(mainDatasets[0].point[0].value) : "-",
    mainDatasets?.[1]?.point?.[0]?.value ? JSON.stringify(mainDatasets[1].point[0].value) : "-");

  // Parse distance
  let distanceMeters: number | undefined;
  const distDataset = distanceResult?.bucket?.[0]?.dataset?.[0];
  if (distDataset) {
    distanceMeters = Math.round(sumValues(distDataset, 0, "fp")) || undefined;
  }
  console.log("📥 Distance datasets:", distanceResult?.bucket?.[0]?.dataset?.length,
    distDataset?.point?.[0]?.value ? JSON.stringify(distDataset.point[0].value) : "-");

  console.log("📊 Parsed:", { steps, calories, distanceMeters });

  return { steps, calories, distanceMeters };
}
