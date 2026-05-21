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

async function fetchDataset(
  accessToken: string,
  startTimeMillis: number,
  endTimeMillis: number,
  dataTypes: { dataTypeName: string }[],
  valueIndex: number,
  valueType: "int" | "fp" = "fp",
): Promise<number> {
  const requestBody = {
    aggregateBy: dataTypes,
    bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
    startTimeMillis,
    endTimeMillis,
  };

  const response = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    return 0;
  }

  const json = (await response.json()) as GoogleFitAggregateResponse;
  const firstBucket = json.bucket?.[0];
  const dataset = firstBucket?.dataset?.[valueIndex];

  if (!dataset?.point) return 0;

  return dataset.point.reduce((sum, point) => {
    const raw = point.value?.[0];
    if (!raw) return sum;
    const val = valueType === "int" ? (raw.intVal ?? 0) : (raw.fpVal ?? 0);
    return sum + Math.max(0, val);
  }, 0);
}

export async function fetchGoogleFitSummary(params: {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
}): Promise<GoogleFitSummary> {
  const { accessToken, startTimeMillis, endTimeMillis } = params;

  const [steps, calories, heartRateData, distanceMeters] = await Promise.all([
    fetchDataset(accessToken, startTimeMillis, endTimeMillis, [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
    ], 0, "int"),

    fetchDataset(accessToken, startTimeMillis, endTimeMillis, [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
    ], 1, "fp"),

    fetchDataset(accessToken, startTimeMillis, endTimeMillis, [
      { dataTypeName: "com.google.heart_rate.bpm" },
    ], 0, "fp"),

    fetchDataset(accessToken, startTimeMillis, endTimeMillis, [
      { dataTypeName: "com.google.distance.delta" },
    ], 0, "fp"),
  ]);

  return {
    steps,
    calories: Math.round(calories),
    heartRate: Math.round(heartRateData) || undefined,
    distanceMeters: Math.round(distanceMeters) || undefined,
  };
}
