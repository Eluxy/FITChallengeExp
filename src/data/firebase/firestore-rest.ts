type DailyProgressRecord = {
  date: string;
  steps: number;
  calories: number;
};

function getFirestoreBaseUrl() {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error("Firebase env vars are not configured");
  }

  return {
    projectId,
    apiKey,
    documentsUrl: `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`,
  };
}

function parseInteger(value?: string): number {
  if (!value) {
    return 0;
  }
  return Number.parseInt(value, 10) || 0;
}

export async function upsertDailyProgress(params: {
  documentId: string;
  userId: string;
  displayName: string;
  date: string;
  steps: number;
  calories: number;
  progressPercent: number;
}) {
  const { documentsUrl, apiKey } = getFirestoreBaseUrl();
  const url = `${documentsUrl}/daily_progress/${params.documentId}?key=${apiKey}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        userId: { stringValue: params.userId },
        displayName: { stringValue: params.displayName },
        date: { stringValue: params.date },
        steps: { integerValue: String(params.steps) },
        calories: { integerValue: String(params.calories) },
        progressPercent: { integerValue: String(params.progressPercent) },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to write daily progress");
  }
}

export async function fetchDailyProgressRange(params: {
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<DailyProgressRecord[]> {
  const { documentsUrl, apiKey } = getFirestoreBaseUrl();
  const url = `${documentsUrl}:runQuery?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "daily_progress" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: "userId" },
                  op: "EQUAL",
                  value: { stringValue: params.userId },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: "date" },
                  op: "GREATER_THAN_OR_EQUAL",
                  value: { stringValue: params.startDate },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: "date" },
                  op: "LESS_THAN_OR_EQUAL",
                  value: { stringValue: params.endDate },
                },
              },
            ],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to read daily progress");
  }

  const json = (await response.json()) as {
    document?: {
      fields?: {
        date?: { stringValue?: string };
        steps?: { integerValue?: string };
        calories?: { integerValue?: string };
      };
    };
  }[];

  return json
    .map((entry) => entry.document?.fields)
    .filter((fields): fields is NonNullable<typeof fields> => Boolean(fields))
    .map((fields) => ({
      date: fields.date?.stringValue ?? "",
      steps: parseInteger(fields.steps?.integerValue),
      calories: parseInteger(fields.calories?.integerValue),
    }));
}
