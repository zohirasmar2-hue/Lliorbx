// api/roblox.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: "missing username" });
    }

    // 1) جيب userId من username
    const usersResp = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
    });
    if (!usersResp.ok) throw new Error("users API fail");
    const usersJson = await usersResp.json();
    const userObj = usersJson.data && usersJson.data[0];
    if (!userObj) return res.status(404).json({ error: "user not found" });

    const userId = userObj.id;

    // 2) تفاصيل
    const detailsResp = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const details = detailsResp.ok ? await detailsResp.json() : {};

    // 3) Avatar
    const thumbResp = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
    );
    const thumbJson = thumbResp.ok ? await thumbResp.json() : {};
    const avatarUrl = thumbJson?.data?.[0]?.imageUrl || null;

    // 4) Presence
    const presResp = await fetch("https://presence.roblox.com/v1/presence/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    });
    const presenceJson = presResp.ok ? await presResp.json() : {};
    const presence = presenceJson?.userPresences?.[0] || null;

    // 5) رجّع JSON
    return res.status(200).json({
      id: userId,
      username: userObj.name,
      displayName: userObj.displayName || details.displayName || null,
      created: details.created || null,
      description: details.description || null,
      avatarUrl,
      presence,
      profileUrl: `https://www.roblox.com/users/${userId}/profile`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
