import monday from "../config/mondayQueries.json";
import config from "../config/mondayConfig.json";

function getDisplayName(name: string) {
    const isCouple = name.includes(" & ") || name.includes(" and ");
    const firstSpaceIndex = name.indexOf(" ");
    if (firstSpaceIndex < 0) {
        return name;
    } else if (isCouple) {
        console.log(name, " is a couple");
        const array1 = name.split(' ');
        const ampersandIndex = array1.indexOf('&') || array1.indexOf('and');

        const personOne = array1[0];
        const personTwo = array1[ampersandIndex + 1];
        const lastName = array1[array1.length - 1].slice(0,1);
        return `${personOne} & ${personTwo} ${lastName}`;
    } else {
        const firstName = name.slice(0, firstSpaceIndex);
        const secondInitial = name[firstSpaceIndex + 1] || "";
        return `${firstName} ${secondInitial}`;
    }

}

async function init() {
    console.log("Hello, Los Alamos, NV!");
    const boardName = "donorTracking";
    const subBoardName = "donations";
    const url = "https://api.monday.com/v2";
    const queryObj = monday[boardName][subBoardName];

    const context = { 
        boardId: config[boardName][subBoardName].board,
        groupId: config[boardName][subBoardName].group
    };

    const dataDump = await fetchGraphQL(url, queryObj, context);

    if (document.getElementById("sponsorDashboard")) {
        console.log("Intialize Sponsor Creation...")
        const expandedList = santizeData(dataDump);
        const mergedSponsors = mergeSponsors(expandedList);
        console.log("Merged Sponsors:", mergedSponsors);


        const categories = [
            { title: "Greater than $1000", predicate: (total: number) => total > 1000 },
            { title: "$500-$999", predicate: (total: number) => total >= 500 && total <= 999 },
            { title: "$250-$499", predicate: (total: number) => total >= 250 && total <= 499 },
            { title: "$100-$249", predicate: (total: number) => total >= 100 && total <= 249 },
            { title: "Less than $100", predicate: (total: number) => total < 100 }
        ];

        const groupedHtml = categories.map(category => {
            const sponsorsInCategory = mergedSponsors
                .filter(sponsor => category.predicate(sponsor.total))
                .map(sponsor => getDisplayName(sponsor.name));

            if (!sponsorsInCategory.length) {
                return "";
            }

            return `<section class="breakdown">
                <details open>
                    <summary>${category.title}</summary>
                    <div class="sponsor__container">
                        ${sponsorsInCategory.map(name => `<p>${name}</p>`).join("")}
                    </div>
                </details>
            </section>`;
        }).join("");

        document.getElementById("sponsorDashboard")!.innerHTML = groupedHtml;
    }


}

function buildDate(timestamp: string) {
    const date = new Date(timestamp);

    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();

    return `${month}/${day}/${year}`;
}

function santizeData(data: any) {
    const groupData = data.boards[0].groups[0];
    console.log("Sanitaze group dump:", groupData);
    const sponsorRawData = groupData.items_page?.items;
    const polishedSponsors = sponsorRawData.map((item: {id: String, name: String, column_values: []}) => {
        let date;
        if(JSON.parse(item.column_values[1]?.value)) {
            date = JSON.parse(item.column_values[1]?.value);
        } else {
            console.warn("Warning: Missing or invalid date for item:", item.name, "Using current date instead.");
            date = { changed_at: new Date().toISOString() };
        }
        return {
            name: item.name,
            donations: [{
                value: Number(item.column_values[0]?.value?.slice(1, -1)),
                timestamp: buildDate(date.changed_at)
            }]
        }
    })
    console.log("Sanitaze group dump:", polishedSponsors);
    return polishedSponsors;

}

type Donation = { value: number; timestamp: string };
type Person = { name: string; donations: Donation[]; total: number };

function mergeSponsors(sponsors: Person[]): Person[] {

  const merged = new Map<string, Person>();

  for (const item of sponsors) {
    const donationTotal = item.donations.reduce((sum, donation) => sum + donation.value, 0);
    const existing = merged.get(item.name);
    if (existing) {
      existing.donations.push(...item.donations);
      existing.total += donationTotal;
    } else {
      merged.set(item.name, { name: item.name, donations: [...item.donations], total: donationTotal });
    }
  }

  return Array.from(merged.values());
}

async function fetchGraphQL(endpoint: string, query: any, variables = {}) {
    const boardId = 9408133671;
    const groupId = "group_mks1945c";
  try {
    const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY0Mjc5MzAwNCwiYWFpIjoxMSwidWlkIjo2ODE0NTk5NSwiaWFkIjoiMjAyNi0wNC0wOFQwMDoxOTozNC43NDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MjYyNzI0OTcsInJnbiI6InVzZTEifQ.uZKtnLsRmaD9N1ATFsuybvKxLGUf-vkq73DICNwEtYE'
    },
    body: JSON.stringify({
        query: `query laacQuery($board: ID!, $group: String){
            boards(ids: [$board]) {
                groups(ids: [$group]) {
                title
                id
                    items_page(limit: 500) {
                        items {
                        id
                        name
                            column_values(ids: ["numbers", "status7"]) {
                                value
                            }
                        }
                    }
                }
            }
        }`,
        variables: {
            board: 9408133671,
            group: "group_mks1945c"
        }
    })
    });

    const {data, errors} = await response.json();

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
    }

    console.log("GraphQL response data:", data);
    return data;
  } catch (error) {
    console.error("Fetch failed:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", init);

document.addEventListener("page:loaded", init);