// See https://observablehq.com/framework/config for documentation.

export default {
  // The project’s title; used in the sidebar and webpage titles.
  title: "Helldivers 2 Planet Table",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  pages: [
    {
      name: "Planet Statistics",
      pages: [
        {name: "Planet Table", path: "/index"},
        {name: "Planet Charts", path: "/index2"}
      ]
    },
    {
      name: "Biome/Sector Statistics",
      pages: [
        {name: "Biome Data", path: "/BiomeData"},
        {name: "Sector Data", path: "/SectorData"},
      ]
    },
    {
      name: "About",
      pages: [
        {name: "About", path: "/report"},
      ]
    },
  ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: `<meta content="Helldivers 2 Planet Table" property="og:title" />
<meta content="Tables and graphs gathered across the entire Helldivers 2 Galactic War, split by front." property="og:description" />
  <link rel="icon" href="observable.png" type="image/png" sizes="32x32">
  <style>
  
@import url('https://fonts.googleapis.com/css2?family=Goldman&display=swap');

@import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed&display=swap');
body{ 
  font-family: 'Goldman' !important;
}
p,
table,
figure,
figcaption,
h1,
h2,
h3,
h4,
h5,
h6,
.katex-display {
  max-width: 100%;
}
#observablehq-sidebar {
  font-family: 'Goldman' !important;

}
.card, .big {
  font-family: 'Goldman' !important;
}
[class*="inputs"] {
  font-family: 'Roboto Condensed' !important;
}
[class*="plot"] {
  font-family: 'Goldman' !important;
}
</style>
  
  `,
  // The path to the source root.
  root: "src",
  ".py": ["./.venv/Scripts/python.exe"],
  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // cleanUrls: true, // drop .html from URLs
};
