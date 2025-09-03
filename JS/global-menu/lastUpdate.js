export async function fetchLastCommitTime() {
  const username = "viktorvasilev-web";
  const repo = "AxieAXP";
  const branch = "main"; // ← коригирано от "main"

  const apiUrl = `https://api.github.com/repos/${username}/${repo}/commits/${branch}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const commitTime = new Date(data.commit.committer.date);
    const now = new Date();
    const diffMs = now - commitTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let displayText = "";

    if (diffMins < 1) {
      displayText = "⏱️ Updated just now";
    } else if (diffMins < 60) {
      displayText = `⏱️ Updated ${diffMins} min ago`;
    } else if (diffHours < 24) {
      displayText = `⏱️ Updated ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      displayText = `⏱️ Updated ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }

    const el = document.getElementById("lastUpdate");
    if (el) {
      el.textContent = displayText;
    }
  } catch (error) {
    console.error("❌ Failed to fetch last update time:", error);
  }
}
