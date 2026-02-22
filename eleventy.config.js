import fs from "fs";
import matter from "gray-matter";

export default async function (eleventyConfig) {
    // Configure Eleventy
    eleventyConfig.addPassthroughCopy("assets/");
    eleventyConfig.addFilter("parseSections", (inputPath) => {
        const raw = fs.readFileSync(inputPath, "utf8");
        const { content } = matter(raw);

        const lines = content.split("\n");
        const parts = [];

        let prevEnHeading = null;
        let i = 0;

        function processInline(text) {
            return text.replace(/  $/gm, "<br>").trim();
        }

        function collectParagraphs(startIndex) {
            const paragraphs = [];
            let current = [];
            let j = startIndex;

            while (j < lines.length) {
                const line = lines[j];
                if (line.startsWith("# ") || line.match(/^!\[.*\]\(\//)) break;
                if (line.trim() === "") {
                    if (current.length) {
                        paragraphs.push(processInline(current.join("\n")));
                        current = [];
                    }
                } else {
                    current.push(line);
                }
                j++;
            }
            if (current.length) {
                paragraphs.push(processInline(current.join("\n")));
            }
            return { paragraphs, endIndex: j };
        }

        while (i < lines.length) {
            const line = lines[i];

            if (line.match(/^!\[.*\]\(\//)) {
                const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
                if (match) {
                    parts.push({ type: "image", alt: match[1], src: match[2] });
                }
                i++;
                continue;
            }

            if (line.startsWith("# ")) {
                const enHeading = line.slice(2).trim();
                i++;

                const enResult = collectParagraphs(i);
                i = enResult.endIndex;

                if (!lines[i]?.startsWith("# ")) continue;
                const spHeading = lines[i].slice(2).trim();
                i++;

                const spResult = collectParagraphs(i);
                i = spResult.endIndex;

                const isDupe = enHeading === prevEnHeading;
                prevEnHeading = enHeading;

                parts.push({
                    type: "section",
                    "heading_en": isDupe ? null : enHeading,
                    "heading_sp": isDupe ? null : spHeading,
                    "paragraphs_en": enResult.paragraphs,
                    "paragraphs_sp": spResult.paragraphs,
                });

                continue;
            }

            i++;
        }

        return parts;
    });


};