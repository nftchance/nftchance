import dedent from "dedent";
import { parseStringPromise } from "xml2js";

const sitemapUrl = "https://chance.utc24.io/sitemap.xml";

async function fetchSitemapUrls(sitemapUrl: string) {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);

    const sitemapText = await response.text();
    const sitemapObject = await parseStringPromise(sitemapText);

    const urls = sitemapObject.urlset.url
      .map((urlEntry: any) => ({
        loc: urlEntry.loc[0],
        updatedAt: urlEntry.lastmod ? urlEntry.lastmod[0] : undefined,
      }))
      .filter((url: any) => url.loc.includes("/paper/") && url.updatedAt)
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

    for (let i = 0; i < urls.length; i++) {
      const response = await fetch(urls[i].loc);
      if (!response.ok)
        throw new Error(`Failed to fetch url: ${response.statusText}`);

      const html = await response.text();
      console.log(
        html.match(/<title>(.*?)<\/title>/)?.[1].replace(" | CHANCE", "") ?? ""
      );
      const title = (
        html.match(/<title>(.*?)<\/title>/)?.[1].replace(" | CHANCE", "") ?? ""
      )
        .split(" ")
        .map((segment) =>
          segment
            .split("-")
            .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
            .join("-")
        )
        .join(" ")
        .replaceAll("Erc", "ERC")
        .replaceAll("Mev", "MEV");

      urls[i].title = title;
    }

    return urls
      .slice(0, 5)
      .map(
        (url: any) =>
          `{
          title: "${url.title}",
          url: "${url.loc}"
      }`
      )
      .join(",\n      ");
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getTransactionsEnabled() {
  const transactions = 114_290;

  const response = await fetch(
    "https://flipsidecrypto.xyz/api/v1/queries/8bd312e2-e506-4a9b-9f25-6fe5ac70e178/data/latest",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    return transactions;
  }

  const json: any = await response.json();

  if (json.length === 0) {
    return transactions;
  }

  return Number(json[0].TRANSACTIONS) + 64_151;
}

const readme = dedent`
\`\`\`typescript
  const CHANCE = { 
    role: "CEO",
    worksAt: "Terminally Online",
    languages: ["Python", "Typescript", "Solidity", "Assembly", "SQL"],
    specialties: [
        "Full-Stack & Onchain Development", 
        "Large-Scale Business Optimizaton",
        "Visual System Design"
    ],
    transactionsEnabled: ${await getTransactionsEnabled()},
    scheduleAMeeting: "https://chance.utc24.io/tools/meeting/",
    recentArticles: [
      ${await fetchSitemapUrls(sitemapUrl)}
    ]
}
\`\`\`
`;

await Bun.write("README.md", readme);
