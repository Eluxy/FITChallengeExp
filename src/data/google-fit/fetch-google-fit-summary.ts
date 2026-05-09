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
};

export async function fetchGoogleFitSummary(params: {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
}): Promise<GoogleFitSummary> {
  const response = await fetch(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aggregateBy: [
          { dataTypeName: "com.google.step_count.delta" },
          { dataTypeName: "com.google.calories.expended" },
        ],
        bucketByTime: { durationMillis: params.endTimeMillis - params.startTimeMillis },
        startTimeMillis: params.startTimeMillis,
        endTimeMillis: params.endTimeMillis,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Не удалось получить данные Google Fit");
  }

  const json = (await response.json()) as GoogleFitAggregateResponse;
  const firstBucket = json.bucket?.[0];
  const stepDataset = firstBucket?.dataset?.[0];
  const caloriesDataset = firstBucket?.dataset?.[1];

  const steps =
    stepDataset?.point?.reduce((sum, point) => {
      const value = point.value?.[0]?.intVal ?? 0;
      return sum + value;
    }, 0) ?? 0;

  const calories =
    caloriesDataset?.point?.reduce((sum, point) => {
      const value = point.value?.[0]?.fpVal ?? 0;
      return sum + value;
    }, 0) ?? 0;

  return {
    steps,
    calories: Math.round(calories),
  };
}

