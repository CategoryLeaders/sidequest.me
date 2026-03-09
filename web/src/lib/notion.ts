import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const dataSourceId = process.env.NOTION_DATABASE_ID || "";

type Idea = {
  id: string;
  type: "long" | "short";
  title?: string;
  description?: string;
  text?: string;
  date: string;
  tags?: string[];
};

export async function getIdeas(): Promise<Idea[]> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    return [];
  }

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    sorts: [{ property: "Date", direction: "descending" }],
    filter: {
      property: "Published",
      checkbox: { equals: true },
    },
  });

  return response.results.map((page: any) => {
    const props = page.properties;
    const type: "long" | "short" =
      props.Type?.select?.name === "Article" ? "long" : "short";

    const title = props.Title?.title?.[0]?.plain_text || "";
    const description =
      props.Description?.rich_text?.[0]?.plain_text || "";
    const text = props.Text?.rich_text?.[0]?.plain_text || "";
    const date = props.Date?.date?.start
      ? new Date(props.Date.date.start).toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        })
      : "";
    const tags =
      props.Tags?.multi_select?.map((t: any) => t.name) || [];

    return type === "long"
      ? { id: page.id, type, title, description, date, tags }
      : { id: page.id, type, text: text || title, date };
  });
}
