export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    console.error("Fetch error:", response.status, response.statusText);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};
