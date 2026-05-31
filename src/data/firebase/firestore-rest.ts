type DailyProgressRecord = {
  date: string;
  steps: number;
  calories: number;
  userId?: string;
  displayName?: string;
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
  console.log("💾 Saving to Firebase...", params);
  
  const { documentsUrl, apiKey } = getFirestoreBaseUrl();
  const url = `${documentsUrl}/daily_progress/${params.documentId}?key=${apiKey}`;
  
  const body = {
    fields: {
      userId: { stringValue: params.userId },
      displayName: { stringValue: params.displayName },
      date: { stringValue: params.date },
      steps: { integerValue: String(params.steps) },
      calories: { integerValue: String(params.calories) },
      progressPercent: { integerValue: String(params.progressPercent) },
      updatedAt: { timestampValue: new Date().toISOString() },
    },
  };
  
  console.log("📤 Request body:", JSON.stringify(body, null, 2));
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  console.log("📥 Response status:", response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log("❌ Firebase error:", errorText);
    throw new Error("Failed to write daily progress");
  }
  
  console.log("✅ Saved to Firebase successfully");
}

export async function fetchDailyProgress(documentId: string): Promise<number | null> {
  try {
    const { documentsUrl, apiKey } = getFirestoreBaseUrl();
    const url = `${documentsUrl}/daily_progress/${documentId}?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = await response.json();
    const fields = json.fields;
    if (!fields?.steps?.integerValue) return null;
    return parseInteger(fields.steps.integerValue);
  } catch {
    return null;
  }
}

export async function fetchDailyProgressRange(params: {
  userId: string;
  startDate: string;
  endDate: string;
}): Promise<DailyProgressRecord[]> {
  const { documentsUrl, apiKey } = getFirestoreBaseUrl();
  const url = `${documentsUrl}:runQuery?key=${apiKey}`;

  console.log("📊 Fetching stats from Firebase for userId:", params.userId, "range:", params.startDate, "-", params.endDate);

  const filters = [
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
  ];

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
            filters,
          },
        },
      },
    }),
  });

  console.log("📊 Firestore response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log("❌ Firestore read error status:", response.status);
    console.log("❌ Firestore read error body:", errorText);
    throw new Error("Failed to read daily progress");
  }

  const json = (await response.json()) as {
    document?: {
      fields?: {
        date?: { stringValue?: string };
        steps?: { integerValue?: string };
        calories?: { integerValue?: string };
        userId?: { stringValue?: string };
        displayName?: { stringValue?: string };
      };
    };
  }[];

  console.log("📊 Firestore raw response count:", json.length);

  const allRecords = json
    .map((entry) => entry.document?.fields)
    .filter((fields): fields is NonNullable<typeof fields> => Boolean(fields))
    .map((fields) => ({
      date: fields.date?.stringValue ?? "",
      steps: parseInteger(fields.steps?.integerValue),
      calories: parseInteger(fields.calories?.integerValue),
      userId: fields.userId?.stringValue ?? "",
      displayName: fields.displayName?.stringValue ?? "Пользователь",
    }));

  console.log("📊 Records count:", allRecords.length);
  return allRecords;
}
