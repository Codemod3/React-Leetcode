import { hidden, stub, test, type CategoryBank } from "./types.js";

export const jsx: CategoryBank = {
  category: "JSX",
  level: 1,
  type: "COMPONENT",
  prerequisites: [],
  problems: [
    {
      slug: "hello-react",
      title: "Hello React",
      difficulty: "BEGINNER",
      tags: ["jsx"],
      estimatedMinutes: 3,
      description:
        "Welcome to ReactCode! A React component is a JavaScript function that returns JSX — HTML-like markup describing what should appear on screen.\n\nEdit the `App` component so it returns a single `<h1>` heading with the text `Hello, React!`.\n\nOnly change the code inside the function. Keep the `export default App;` line — that's how the platform finds your component.",
      requirements: ["Renders an <h1> element", "The heading's text is exactly 'Hello, React!'"],
      hints: [
        "Replace `return null;` with something that returns markup.",
        "JSX looks like HTML: `return <h1>...</h1>;`",
      ],
      starterCode: stub("App"),
      solutionCode: `function App() {\n  return <h1>Hello, React!</h1>;\n}\n\nexport default App;\n`,
      explanation:
        "A component is just a function. Whatever JSX it returns is what React renders. `<h1>Hello, React!</h1>` compiles to a call that creates an h1 element containing that text.",
      commonMistakes: [
        "Removing `export default App;` — the platform can't find your component without it.",
        "Typos in the text: tests compare it exactly, including the comma and exclamation mark.",
      ],
      tests: [
        test("renders 'Hello, React!'", `renderComponent();\nexpectText("Hello, React!");`),
        hidden(
          "uses a real <h1> element",
          `renderComponent();\nconst heading = screen.getByRole("heading", { level: 1 });\nassertEqual(heading.textContent, "Hello, React!", "The <h1> should contain exactly 'Hello, React!'");`
        ),
      ],
      wrongSolutions: [`function App() {\n  return <p>Hello, React!</p>;\n}\n\nexport default App;\n`],
    },
    {
      slug: "jsx-render-paragraph",
      title: "Render a Paragraph",
      difficulty: "BEGINNER",
      tags: ["jsx"],
      estimatedMinutes: 3,
      description: "Make the `Intro` component return a `<p>` paragraph with the text `React makes building user interfaces fun.`",
      requirements: ["Renders a <p> element", "The paragraph contains the exact sentence"],
      hints: ["Paragraphs use the <p> tag, same as in HTML.", "return <p>...</p>;"],
      starterCode: stub("Intro"),
      solutionCode: `function Intro() {\n  return <p>React makes building user interfaces fun.</p>;\n}\n\nexport default Intro;\n`,
      explanation: "JSX supports all the standard HTML elements. A lowercase tag like `p` becomes a real DOM element.",
      tests: [
        test("renders the sentence", `renderComponent();\nexpectText("React makes building user interfaces fun.");`),
        hidden(
          "the sentence is inside a <p>",
          `renderComponent();\nconst el = expectText("React makes building user interfaces fun.");\nassertEqual(el.tagName, "P", "Expected the text to be inside a <p> element");`
        ),
      ],
      wrongSolutions: [`function Intro() {\n  return <div>React makes building user interfaces fun.</div>;\n}\n\nexport default Intro;\n`],
    },
    {
      slug: "jsx-multiple-headings",
      title: "Render Multiple Headings",
      difficulty: "BEGINNER",
      tags: ["jsx"],
      estimatedMinutes: 5,
      description:
        "Make `Outline` render three headings, in this order:\n\n- an `<h1>` with `Main Title`\n- an `<h2>` with `Subtitle`\n- an `<h3>` with `Section`\n\nA component can only return **one** root element, so wrap the three headings in a `<div>`.",
      requirements: ["Renders h1 'Main Title'", "Renders h2 'Subtitle'", "Renders h3 'Section'", "All three are wrapped in one parent element"],
      hints: [
        "Returning two sibling elements without a parent is a syntax error in JSX.",
        "Wrap them: return (<div> ... </div>);",
        "Use parentheses around multi-line JSX so the return statement doesn't end early.",
      ],
      starterCode: stub("Outline"),
      solutionCode: `function Outline() {\n  return (\n    <div>\n      <h1>Main Title</h1>\n      <h2>Subtitle</h2>\n      <h3>Section</h3>\n    </div>\n  );\n}\n\nexport default Outline;\n`,
      explanation:
        "JSX compiles to function calls, and a function can only return one value — so a component returns a single root element that contains everything else.",
      commonMistakes: ["Writing `return` on its own line followed by JSX without parentheses — JavaScript inserts a semicolon and returns undefined."],
      tests: [
        test(
          "renders all three headings",
          `renderComponent();\nexpectText("Main Title");\nexpectText("Subtitle");\nexpectText("Section");`
        ),
        hidden(
          "uses the right heading levels",
          `renderComponent();\nassertEqual(screen.getByRole("heading", { level: 1 }).textContent, "Main Title");\nassertEqual(screen.getByRole("heading", { level: 2 }).textContent, "Subtitle");\nassertEqual(screen.getByRole("heading", { level: 3 }).textContent, "Section");`
        ),
      ],
      wrongSolutions: [
        `function Outline() {\n  return (\n    <div>\n      <h1>Main Title</h1>\n      <h1>Subtitle</h1>\n      <h1>Section</h1>\n    </div>\n  );\n}\n\nexport default Outline;\n`,
      ],
    },
    {
      slug: "jsx-fragment",
      title: "Return Siblings With a Fragment",
      difficulty: "BEGINNER",
      tags: ["jsx", "fragments"],
      estimatedMinutes: 5,
      description:
        "Sometimes you need to return several elements but don't want an extra `<div>` in the page.\n\nMake `Terms` return two paragraphs — `Please read carefully.` and `By continuing you accept the terms.` — **without** any wrapping element. Use a React Fragment (`<>...</>`).",
      requirements: ["Renders both paragraphs", "The paragraphs are not wrapped in an extra DOM element"],
      hints: ["A Fragment groups elements without adding a node to the DOM.", "The short syntax is an empty tag: <> ... </>"],
      starterCode: stub("Terms"),
      solutionCode: `function Terms() {\n  return (\n    <>\n      <p>Please read carefully.</p>\n      <p>By continuing you accept the terms.</p>\n    </>\n  );\n}\n\nexport default Terms;\n`,
      explanation:
        "Fragments satisfy the 'one root element' rule without producing any DOM. This matters when the parent expects direct children, like a <ul> expecting <li>s or a flex/grid container.",
      alternativeApproach: "`<React.Fragment>` is the long form; you need it when the fragment requires a `key`.",
      tests: [
        test("renders both paragraphs", `renderComponent();\nexpectText("Please read carefully.");\nexpectText("By continuing you accept the terms.");`),
        hidden(
          "does not add a wrapper element",
          `const { container } = renderComponent();\nassertEqual(container.children.length, 2, "Expected two top-level <p> elements and no wrapper");\nassertEqual(container.children[0].tagName, "P");`
        ),
      ],
      wrongSolutions: [
        `function Terms() {\n  return (\n    <div>\n      <p>Please read carefully.</p>\n      <p>By continuing you accept the terms.</p>\n    </div>\n  );\n}\n\nexport default Terms;\n`,
      ],
    },
    {
      slug: "jsx-embed-variable",
      title: "Embed a Variable in JSX",
      difficulty: "BEGINNER",
      tags: ["jsx", "expressions"],
      estimatedMinutes: 5,
      description:
        "The starter code defines a variable `name`. Render a `<p>` that says `Hello, Alex!` — but insert the name **from the variable** using curly braces `{ }`, rather than typing it into the markup.",
      requirements: ["Renders 'Hello, Alex!'", "Uses the `name` variable inside JSX"],
      hints: ["Curly braces in JSX let you drop back into JavaScript.", "<p>Hello, {name}!</p>"],
      starterCode: `function Greeting() {\n  const name = "Alex";\n\n  // Write your solution here\n  return null;\n}\n\nexport default Greeting;\n`,
      solutionCode: `function Greeting() {\n  const name = "Alex";\n\n  return <p>Hello, {name}!</p>;\n}\n\nexport default Greeting;\n`,
      explanation: "Anything inside `{ }` in JSX is a JavaScript expression. React evaluates it and renders the result as text.",
      commonMistakes: ["Writing `Hello, name!` without braces renders the literal word 'name'."],
      tests: [
        test("renders the greeting", `renderComponent();\nexpectText("Hello, Alex!");`),
        hidden("renders exactly one paragraph", `const { container } = renderComponent();\nassertEqual(container.querySelectorAll("p").length, 1);`),
      ],
      wrongSolutions: [`function Greeting() {\n  const name = "Alex";\n  return <p>Hello, name!</p>;\n}\n\nexport default Greeting;\n`],
    },
    {
      slug: "jsx-expressions-math",
      title: "Calculate Inside JSX",
      difficulty: "BEGINNER",
      tags: ["jsx", "expressions"],
      estimatedMinutes: 5,
      description:
        "The starter code defines `birthYear` and `currentYear`. Render `<p>I am 30 years old</p>`, computing the age with an expression inside `{ }`.",
      requirements: ["Renders 'I am 30 years old'", "The age is calculated from the two variables"],
      hints: ["Any JavaScript expression can go inside `{ }` — including arithmetic.", "{currentYear - birthYear}"],
      starterCode: `function Age() {\n  const birthYear = 1995;\n  const currentYear = 2025;\n\n  // Write your solution here\n  return null;\n}\n\nexport default Age;\n`,
      solutionCode: `function Age() {\n  const birthYear = 1995;\n  const currentYear = 2025;\n\n  return <p>I am {currentYear - birthYear} years old</p>;\n}\n\nexport default Age;\n`,
      explanation: "JSX expressions are evaluated every render, so values computed from variables (or later, from props and state) stay in sync automatically.",
      tests: [
        test("renders the age", `renderComponent();\nexpectText("I am 30 years old");`),
        hidden("renders a paragraph", `renderComponent();\nassertEqual(expectText("I am 30 years old").tagName, "P");`),
      ],
    },
    {
      slug: "jsx-call-function",
      title: "Call a Function Inside JSX",
      difficulty: "BEGINNER",
      tags: ["jsx", "expressions"],
      estimatedMinutes: 8,
      description:
        "Complete the `formatDate` helper so it returns a date as `month/day/year` (e.g. `1/15/2025`). Then render `<p>Today is 1/15/2025</p>` by **calling** `formatDate(today)` inside your JSX.\n\nNote: `getMonth()` is zero-based (January is 0).",
      requirements: ["formatDate returns 'M/D/YYYY'", "Renders 'Today is 1/15/2025' using formatDate"],
      hints: [
        "Use date.getMonth(), date.getDate(), and date.getFullYear().",
        "Remember to add 1 to getMonth().",
        "Call it in JSX: {formatDate(today)}",
      ],
      starterCode: `export function formatDate(date) {\n  // return "month/day/year"\n}\n\nfunction Today() {\n  const today = new Date(2025, 0, 15);\n\n  // Write your solution here\n  return null;\n}\n\nexport default Today;\n`,
      solutionCode: `export function formatDate(date) {\n  return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();\n}\n\nfunction Today() {\n  const today = new Date(2025, 0, 15);\n\n  return <p>Today is {formatDate(today)}</p>;\n}\n\nexport default Today;\n`,
      explanation: "Function calls are expressions too. Moving formatting into a helper keeps the JSX readable and the logic reusable.",
      commonMistakes: ["Forgetting that getMonth() starts at 0, which renders 0/15/2025.", "Using getDay() (day of the week) instead of getDate() (day of the month)."],
      tests: [
        test("renders today's date", `renderComponent();\nexpectText("Today is 1/15/2025");`),
        hidden(
          "formatDate works for other dates",
          `assertEqual(userExports.formatDate(new Date(2024, 11, 3)), "12/3/2024", "formatDate(new Date(2024, 11, 3))");`
        ),
      ],
      wrongSolutions: [
        `export function formatDate(date) {\n  return "1/15/2025";\n}\n\nfunction Today() {\n  return <p>Today is {formatDate(new Date(2025, 0, 15))}</p>;\n}\n\nexport default Today;\n`,
      ],
    },
    {
      slug: "jsx-object-properties",
      title: "Render Object Properties",
      difficulty: "BEGINNER",
      tags: ["jsx", "expressions", "objects"],
      estimatedMinutes: 5,
      description:
        "The starter code defines a `user` object. Render `<p>Mia lives in Paris and works as a Designer.</p>` using `user.name`, `user.city`, and `user.job`.",
      requirements: ["Renders the sentence using properties of `user`"],
      hints: ["Use dot notation inside braces: {user.name}", "You can have several `{ }` expressions in one element."],
      starterCode: `function UserSummary() {\n  const user = { name: "Mia", city: "Paris", job: "Designer" };\n\n  // Write your solution here\n  return null;\n}\n\nexport default UserSummary;\n`,
      solutionCode: `function UserSummary() {\n  const user = { name: "Mia", city: "Paris", job: "Designer" };\n\n  return (\n    <p>\n      {user.name} lives in {user.city} and works as a {user.job}.\n    </p>\n  );\n}\n\nexport default UserSummary;\n`,
      explanation: "You can render strings and numbers directly, but not whole objects — `{user}` would throw. Pick out the properties you need.",
      commonMistakes: ["Rendering `{user}` directly: 'Objects are not valid as a React child'."],
      tests: [
        test("renders the sentence", `renderComponent();\nexpectText("Mia lives in Paris and works as a Designer.");`),
        hidden("renders a single paragraph", `const { container } = renderComponent();\nassertEqual(container.querySelectorAll("p").length, 1);`),
      ],
    },
    {
      slug: "jsx-image",
      title: "Render an Image With Alt Text",
      difficulty: "BEGINNER",
      tags: ["jsx", "accessibility"],
      estimatedMinutes: 5,
      description:
        "Render an `<img>` whose `src` is `https://picsum.photos/200` and whose `alt` text is `A mountain landscape`.\n\nIn JSX, tags without children must be self-closed: `<img ... />`.",
      requirements: ["Renders an image with the given src", "The image has the alt text 'A mountain landscape'"],
      hints: ["Attributes work like HTML: src=\"...\" alt=\"...\"", "Don't forget the closing slash: <img ... />"],
      starterCode: stub("Photo"),
      solutionCode: `function Photo() {\n  return <img src="https://picsum.photos/200" alt="A mountain landscape" />;\n}\n\nexport default Photo;\n`,
      explanation: "Alt text describes the image for screen-reader users and shows if the image fails to load. Tests find the image by its alt text, the same way assistive technology does.",
      commonMistakes: ["Writing `<img>` without a closing slash, which is a JSX syntax error."],
      tests: [
        test("renders an image with alt text", `renderComponent();\nscreen.getByRole("img", { name: "A mountain landscape" });`),
        hidden(
          "uses the right src",
          `renderComponent();\nassertEqual(screen.getByRole("img").getAttribute("src"), "https://picsum.photos/200");`
        ),
      ],
      wrongSolutions: [`function Photo() {\n  return <img src="https://picsum.photos/200" />;\n}\n\nexport default Photo;\n`],
    },
    {
      slug: "jsx-link",
      title: "Create a Link",
      difficulty: "BEGINNER",
      tags: ["jsx"],
      estimatedMinutes: 3,
      description: "Render a link with the text `React Docs` that points to `https://react.dev`.",
      requirements: ["Renders a link named 'React Docs'", "The link's href is https://react.dev"],
      hints: ["Links use the <a> tag.", "The destination goes in the href attribute."],
      starterCode: stub("DocsLink"),
      solutionCode: `function DocsLink() {\n  return <a href="https://react.dev">React Docs</a>;\n}\n\nexport default DocsLink;\n`,
      explanation: "An `<a>` with an `href` is what browsers and screen readers recognise as a link.",
      tests: [
        test("renders the link", `renderComponent();\nscreen.getByRole("link", { name: "React Docs" });`),
        hidden("points to react.dev", `renderComponent();\nassertEqual(screen.getByRole("link").getAttribute("href"), "https://react.dev");`),
      ],
      wrongSolutions: [`function DocsLink() {\n  return <a href="https://example.com">React Docs</a>;\n}\n\nexport default DocsLink;\n`],
    },
    {
      slug: "jsx-external-link",
      title: "Open a Link in a New Tab",
      difficulty: "BEGINNER",
      tags: ["jsx", "security"],
      estimatedMinutes: 5,
      description:
        "Render a link `Visit GitHub` pointing to `https://github.com` that opens in a new tab.\n\nLinks that open a new tab should also set `rel=\"noopener noreferrer\"` so the new page can't access your page through `window.opener`.",
      requirements: ["href is https://github.com", "target is _blank", "rel is 'noopener noreferrer'"],
      hints: ["target=\"_blank\" opens a new tab.", "Add rel=\"noopener noreferrer\" alongside it."],
      starterCode: stub("GitHubLink"),
      solutionCode: `function GitHubLink() {\n  return (\n    <a href="https://github.com" target="_blank" rel="noopener noreferrer">\n      Visit GitHub\n    </a>\n  );\n}\n\nexport default GitHubLink;\n`,
      explanation: "`target=\"_blank\"` opens a new tab; `rel=\"noopener noreferrer\"` cuts the link between the two pages, which prevents 'tabnabbing' attacks.",
      tests: [
        test("renders the link with target _blank", `renderComponent();\nconst link = screen.getByRole("link", { name: "Visit GitHub" });\nassertEqual(link.getAttribute("target"), "_blank");`),
        hidden(
          "sets rel for safety",
          `renderComponent();\nconst link = screen.getByRole("link", { name: "Visit GitHub" });\nassertEqual(link.getAttribute("href"), "https://github.com");\nassertEqual(link.getAttribute("rel"), "noopener noreferrer");`
        ),
      ],
      wrongSolutions: [`function GitHubLink() {\n  return <a href="https://github.com" target="_blank">Visit GitHub</a>;\n}\n\nexport default GitHubLink;\n`],
    },
    {
      slug: "jsx-classname",
      title: "Use className Instead of class",
      difficulty: "BEGINNER",
      tags: ["jsx", "styling"],
      estimatedMinutes: 5,
      description:
        "Render a `<div>` with the CSS class `card` that contains the text `Styled with CSS`.\n\nIn JSX, `class` is spelled `className` because `class` is a reserved word in JavaScript.",
      requirements: ["Renders a div with class 'card'", "React logs no warning about an invalid DOM property"],
      hints: ["HTML attributes are camelCase in JSX.", "className=\"card\""],
      starterCode: stub("Card"),
      solutionCode: `function Card() {\n  return <div className="card">Styled with CSS</div>;\n}\n\nexport default Card;\n`,
      explanation: "JSX attributes map to DOM properties, and the DOM property for the class attribute is `className`. Similar renames: `htmlFor` for `for`, `tabIndex` for `tabindex`.",
      commonMistakes: ["Using `class` — it still renders, but React warns about it, and it's wrong."],
      tests: [
        test("renders a .card element", `const { container } = renderComponent();\nconst card = container.querySelector(".card");\nassert(card, "No element with class 'card' found");\nassertEqual(card.textContent, "Styled with CSS");`),
        hidden(
          "does not use the invalid `class` attribute",
          `renderComponent();\nassert(!anyConsoleError("className"), "React warned: use className instead of class");`
        ),
      ],
      wrongSolutions: [`function Card() {\n  return <div class="card">Styled with CSS</div>;\n}\n\nexport default Card;\n`],
    },
    {
      slug: "jsx-inline-style",
      title: "Inline Styles Are Objects",
      difficulty: "BEGINNER",
      tags: ["jsx", "styling"],
      estimatedMinutes: 5,
      description:
        "Render `<p>Warning!</p>` with the text colour `red` and the font size `20px`, using the `style` attribute.\n\nIn JSX, `style` takes a JavaScript **object**, and CSS property names are camelCase (`fontSize`, not `font-size`).",
      requirements: ["color is red", "fontSize is 20px"],
      hints: ["style={{ ... }} — the outer braces are JSX, the inner braces are the object.", "{{ color: \"red\", fontSize: \"20px\" }}"],
      starterCode: stub("Warning"),
      solutionCode: `function Warning() {\n  return <p style={{ color: "red", fontSize: "20px" }}>Warning!</p>;\n}\n\nexport default Warning;\n`,
      explanation: "The double braces aren't special syntax: the outer pair embeds a JS expression, and that expression happens to be an object literal.",
      commonMistakes: ["Passing a CSS string (style=\"color: red\") — React requires an object.", "Using kebab-case keys like 'font-size'."],
      tests: [
        test("text is red", `renderComponent();\nassertEqual(expectText("Warning!").style.color, "red");`),
        hidden("font size is 20px", `renderComponent();\nassertEqual(expectText("Warning!").style.fontSize, "20px");`),
      ],
      wrongSolutions: [`function Warning() {\n  return <p style={{ color: "red" }}>Warning!</p>;\n}\n\nexport default Warning;\n`],
    },
    {
      slug: "jsx-label-htmlfor",
      title: "Connect a Label to an Input",
      difficulty: "BEGINNER",
      tags: ["jsx", "forms", "accessibility"],
      estimatedMinutes: 5,
      description:
        "Render a label `Email` and an email input, connected so that clicking the label focuses the input.\n\nGive the input `id=\"email\"` and the label `htmlFor=\"email\"` (`for` is a reserved word in JavaScript).",
      requirements: ["The input has type 'email'", "The label 'Email' is associated with the input"],
      hints: ["The label's htmlFor must match the input's id.", "<label htmlFor=\"email\">Email</label>"],
      starterCode: stub("EmailField"),
      solutionCode: `function EmailField() {\n  return (\n    <div>\n      <label htmlFor="email">Email</label>\n      <input id="email" type="email" />\n    </div>\n  );\n}\n\nexport default EmailField;\n`,
      explanation: "An associated label gives the input an accessible name, which screen readers announce and which `getByLabelText` uses to find it.",
      alternativeApproach: "Wrapping the input inside the label (`<label>Email <input /></label>`) also associates them, without needing an id.",
      tests: [
        test("label is associated with the input", `renderComponent();\nscreen.getByLabelText("Email");`),
        hidden("input is an email input", `renderComponent();\nassertEqual(screen.getByLabelText("Email").getAttribute("type"), "email");`),
      ],
      wrongSolutions: [`function EmailField() {\n  return (\n    <div>\n      <label>Email</label>\n      <input id="email" type="email" />\n    </div>\n  );\n}\n\nexport default EmailField;\n`],
    },
    {
      slug: "jsx-boolean-attributes",
      title: "Boolean Attributes",
      difficulty: "BEGINNER",
      tags: ["jsx", "forms"],
      estimatedMinutes: 5,
      description:
        "Render:\n\n- a **disabled** button with the text `Saving...`\n- a checkbox labelled `Remember me` that starts **checked**\n\nFor an uncontrolled checkbox that starts checked, use `defaultChecked`.",
      requirements: ["The 'Saving...' button is disabled", "The 'Remember me' checkbox starts checked"],
      hints: ["Writing just `disabled` means disabled={true}.", "Use <input type=\"checkbox\" defaultChecked /> inside a <label>."],
      starterCode: stub("SaveStatus"),
      solutionCode: `function SaveStatus() {\n  return (\n    <div>\n      <button disabled>Saving...</button>\n      <label>\n        <input type="checkbox" defaultChecked /> Remember me\n      </label>\n    </div>\n  );\n}\n\nexport default SaveStatus;\n`,
      explanation: "A bare boolean attribute in JSX is shorthand for `={true}`. `defaultChecked` sets the initial state without React controlling the checkbox afterwards.",
      commonMistakes: ["Using `checked` without an onChange handler: React makes the checkbox read-only and warns."],
      tests: [
        test("button is disabled", `renderComponent();\nassert(screen.getByRole("button", { name: "Saving..." }).disabled, "The button should be disabled");`),
        hidden("checkbox starts checked", `renderComponent();\nassert(screen.getByRole("checkbox", { name: "Remember me" }).checked, "The checkbox should start checked");`),
      ],
      wrongSolutions: [`function SaveStatus() {\n  return (\n    <div>\n      <button disabled>Saving...</button>\n      <label><input type="checkbox" /> Remember me</label>\n    </div>\n  );\n}\n\nexport default SaveStatus;\n`],
    },
    {
      slug: "jsx-attribute-expressions",
      title: "Use JavaScript in Attributes",
      difficulty: "BEGINNER",
      tags: ["jsx", "expressions"],
      estimatedMinutes: 5,
      description:
        "The starter code defines `avatarUrl`, `size`, and `username`. Render an `<img>` whose `src` is `avatarUrl`, whose `width` and `height` are `size`, and whose `alt` is `Avatar of ada`, built from `username`.",
      requirements: ["src comes from avatarUrl", "width and height are 64", "alt is 'Avatar of ada'"],
      hints: ["Attribute values can be expressions: src={avatarUrl}", "Build the alt text with a template literal or string concatenation."],
      starterCode: `function Avatar() {\n  const avatarUrl = "https://i.pravatar.cc/64";\n  const size = 64;\n  const username = "ada";\n\n  // Write your solution here\n  return null;\n}\n\nexport default Avatar;\n`,
      solutionCode: `function Avatar() {\n  const avatarUrl = "https://i.pravatar.cc/64";\n  const size = 64;\n  const username = "ada";\n\n  return <img src={avatarUrl} width={size} height={size} alt={"Avatar of " + username} />;\n}\n\nexport default Avatar;\n`,
      explanation: "Use quotes for fixed string attributes and braces for anything computed. Don't combine them: `src=\"{avatarUrl}\"` is the literal text '{avatarUrl}'.",
      commonMistakes: ["Wrapping braces in quotes: src=\"{avatarUrl}\"."],
      tests: [
        test("renders the avatar", `renderComponent();\nconst img = screen.getByRole("img", { name: "Avatar of ada" });\nassertEqual(img.getAttribute("src"), "https://i.pravatar.cc/64");`),
        hidden("uses size for width and height", `renderComponent();\nconst img = screen.getByRole("img");\nassertEqual(img.getAttribute("width"), "64");\nassertEqual(img.getAttribute("height"), "64");`),
      ],
    },
    {
      slug: "jsx-static-list",
      title: "Render a Static List",
      difficulty: "BEGINNER",
      tags: ["jsx", "lists"],
      estimatedMinutes: 3,
      description: "Render an unordered list (`<ul>`) with three items: `HTML`, `CSS`, and `JavaScript`.",
      requirements: ["Renders a <ul>", "It contains exactly three <li> items, in order"],
      hints: ["<ul> contains <li> elements.", "Write each <li> by hand — mapping over arrays comes later."],
      starterCode: stub("Skills"),
      solutionCode: `function Skills() {\n  return (\n    <ul>\n      <li>HTML</li>\n      <li>CSS</li>\n      <li>JavaScript</li>\n    </ul>\n  );\n}\n\nexport default Skills;\n`,
      explanation: "Lists are just nested elements. Later you'll generate the <li>s from an array with map().",
      tests: [
        test("renders the three skills", `renderComponent();\nexpectText("HTML");\nexpectText("CSS");\nexpectText("JavaScript");`),
        hidden(
          "uses list items in order",
          `renderComponent();\nconst items = screen.getAllByRole("listitem").map((li) => li.textContent);\nassertEqual(items, ["HTML", "CSS", "JavaScript"]);`
        ),
      ],
      wrongSolutions: [`function Skills() {\n  return (\n    <div>\n      <p>HTML</p>\n      <p>CSS</p>\n      <p>JavaScript</p>\n    </div>\n  );\n}\n\nexport default Skills;\n`],
    },
    {
      slug: "jsx-table",
      title: "Render a Simple Table",
      difficulty: "BEGINNER",
      tags: ["jsx", "tables"],
      estimatedMinutes: 8,
      description:
        "Render a table with a header row `Name | Age` and one data row `Alice | 30`.\n\nUse `<thead>` and `<tbody>`. React warns if `<tr>` is placed directly inside `<table>`.",
      requirements: ["Column headers 'Name' and 'Age'", "A row with the cells 'Alice' and '30'", "Valid table structure (thead/tbody)"],
      hints: ["Header cells are <th>, data cells are <td>.", "<table><thead><tr>...</tr></thead><tbody><tr>...</tr></tbody></table>"],
      starterCode: stub("PeopleTable"),
      solutionCode: `function PeopleTable() {\n  return (\n    <table>\n      <thead>\n        <tr>\n          <th>Name</th>\n          <th>Age</th>\n        </tr>\n      </thead>\n      <tbody>\n        <tr>\n          <td>Alice</td>\n          <td>30</td>\n        </tr>\n      </tbody>\n    </table>\n  );\n}\n\nexport default PeopleTable;\n`,
      explanation: "Browsers silently fix up invalid table markup, which can make React's DOM drift out of sync with what it expects. React warns so you write the valid structure.",
      tests: [
        test("renders headers and cells", `renderComponent();\nscreen.getByRole("columnheader", { name: "Name" });\nscreen.getByRole("columnheader", { name: "Age" });\nscreen.getByRole("cell", { name: "Alice" });\nscreen.getByRole("cell", { name: "30" });`),
        hidden(
          "uses valid table nesting",
          `renderComponent();\nassert(!anyConsoleError("validateDOMNesting", "cannot be a child", "cannot appear as a child"), "React warned about invalid table nesting — use <thead> and <tbody>");`
        ),
      ],
      wrongSolutions: [`function PeopleTable() {\n  return (\n    <table>\n      <tr><th>Name</th><th>Age</th></tr>\n      <tr><td>Alice</td><td>30</td></tr>\n    </table>\n  );\n}\n\nexport default PeopleTable;\n`],
    },
    {
      slug: "create-a-button",
      title: "Create a Button",
      difficulty: "BEGINNER",
      tags: ["jsx", "accessibility"],
      estimatedMinutes: 3,
      description: "Make `AppButton` render a button with the text `Click Me`. Use a real `<button>` element.",
      requirements: ["Renders a real <button> element", "The button's accessible name is 'Click Me'"],
      hints: ["Use a native <button> element, not a styled <div>.", "return <button>Click Me</button>;"],
      starterCode: stub("AppButton"),
      solutionCode: `function AppButton() {\n  return <button>Click Me</button>;\n}\n\nexport default AppButton;\n`,
      explanation: "A semantic <button> is keyboard-accessible and announced correctly by screen readers. A <div> with a click handler is neither.",
      tests: [
        test("renders a button named 'Click Me'", `renderComponent();\nscreen.getByRole("button", { name: "Click Me" });`),
        hidden("renders exactly one button", `renderComponent();\nassertEqual(screen.getAllByRole("button").length, 1);`),
      ],
      wrongSolutions: [`function AppButton() {\n  return <div>Click Me</div>;\n}\n\nexport default AppButton;\n`],
    },
    {
      slug: "create-a-header",
      title: "Create a Header",
      difficulty: "BEGINNER",
      tags: ["jsx", "semantic-html"],
      estimatedMinutes: 8,
      description:
        "Make `Header` render a page header:\n\n- a `<header>` element\n- inside it, an `<h1>` with `ReactCode`\n- and a `<nav>` with three links: `Home` (`/`), `Problems` (`/problems`), and `Profile` (`/profile`)",
      requirements: ["Uses a <header> element", "h1 'ReactCode'", "A <nav> with Home, Problems and Profile links with the right hrefs"],
      hints: [
        "<header> and <nav> are semantic elements — they work like <div> but carry meaning.",
        "Each link is an <a href=\"...\">.",
      ],
      starterCode: `function Header() {\n  return (\n    <div>\n      {/* Write your solution here */}\n    </div>\n  );\n}\n\nexport default Header;\n`,
      solutionCode: `function Header() {\n  return (\n    <header>\n      <h1>ReactCode</h1>\n      <nav>\n        <a href="/">Home</a>\n        <a href="/problems">Problems</a>\n        <a href="/profile">Profile</a>\n      </nav>\n    </header>\n  );\n}\n\nexport default Header;\n`,
      explanation: "Semantic elements like <header> and <nav> become 'landmarks' that screen-reader users can jump between. They're also clearer for other developers to read.",
      tests: [
        test("renders the title", `renderComponent();\nscreen.getByRole("heading", { level: 1, name: "ReactCode" });`),
        test("renders the three links", `renderComponent();\nscreen.getByRole("link", { name: "Home" });\nscreen.getByRole("link", { name: "Problems" });\nscreen.getByRole("link", { name: "Profile" });`),
        hidden(
          "uses header and nav landmarks with correct hrefs",
          `renderComponent();\nscreen.getByRole("banner");\nconst nav = screen.getByRole("navigation");\nconst hrefs = within(nav).getAllByRole("link").map((a) => a.getAttribute("href"));\nassertEqual(hrefs, ["/", "/problems", "/profile"]);`
        ),
      ],
      wrongSolutions: [`function Header() {\n  return (\n    <div>\n      <h1>ReactCode</h1>\n      <a href="/">Home</a>\n      <a href="/problems">Problems</a>\n      <a href="/profile">Profile</a>\n    </div>\n  );\n}\n\nexport default Header;\n`],
    },
    {
      slug: "jsx-footer",
      title: "Create a Footer",
      difficulty: "BEGINNER",
      tags: ["jsx", "semantic-html"],
      estimatedMinutes: 5,
      description: "Render a `<footer>` containing a paragraph `© 2025 ReactCode` and a link `Privacy` pointing to `/privacy`.",
      requirements: ["Uses a <footer> element", "Contains the copyright text", "Contains a Privacy link to /privacy"],
      hints: ["You can type the © character directly, or use {\"\\u00A9\"}.", "<footer> works like a <div> with meaning."],
      starterCode: stub("Footer"),
      solutionCode: `function Footer() {\n  return (\n    <footer>\n      <p>© 2025 ReactCode</p>\n      <a href="/privacy">Privacy</a>\n    </footer>\n  );\n}\n\nexport default Footer;\n`,
      explanation: "A <footer> at the top level of a page becomes the 'contentinfo' landmark.",
      tests: [
        test("renders the copyright", `renderComponent();\nexpectText("© 2025 ReactCode");`),
        hidden(
          "uses a footer landmark with a privacy link",
          `renderComponent();\nconst footer = screen.getByRole("contentinfo");\nassertEqual(within(footer).getByRole("link", { name: "Privacy" }).getAttribute("href"), "/privacy");`
        ),
      ],
      wrongSolutions: [`function Footer() {\n  return (\n    <div>\n      <p>© 2025 ReactCode</p>\n      <a href="/privacy">Privacy</a>\n    </div>\n  );\n}\n\nexport default Footer;\n`],
    },
    {
      slug: "jsx-card",
      title: "Create a Card",
      difficulty: "BEGINNER",
      tags: ["jsx"],
      estimatedMinutes: 5,
      description:
        "Render a card: an `<article>` containing an `<h2>` `Getting Started`, a paragraph `Learn the basics of React in 10 minutes.`, and a button `Read more`.",
      requirements: ["Uses an <article>", "h2 'Getting Started'", "The description paragraph", "A 'Read more' button"],
      hints: ["<article> is for self-contained content, like a card or a blog post.", "Put all three elements inside the article."],
      starterCode: stub("InfoCard"),
      solutionCode: `function InfoCard() {\n  return (\n    <article>\n      <h2>Getting Started</h2>\n      <p>Learn the basics of React in 10 minutes.</p>\n      <button>Read more</button>\n    </article>\n  );\n}\n\nexport default InfoCard;\n`,
      explanation: "Most UI is nested elements like this. Splitting it into reusable components comes in the next level.",
      tests: [
        test("renders the card content", `renderComponent();\nscreen.getByRole("heading", { level: 2, name: "Getting Started" });\nexpectText("Learn the basics of React in 10 minutes.");\nscreen.getByRole("button", { name: "Read more" });`),
        hidden("content is inside an article", `renderComponent();\nconst article = screen.getByRole("article");\nwithin(article).getByRole("button", { name: "Read more" });`),
      ],
    },
    {
      slug: "jsx-product-card",
      title: "Create a Product Card",
      difficulty: "BEGINNER",
      tags: ["jsx"],
      estimatedMinutes: 8,
      description:
        "Render a product card with:\n\n- an image with `src` `/headphones.jpg` and alt `Wireless Headphones`\n- an `<h3>` `Wireless Headphones`\n- a paragraph `$99.99`\n- a button `Add to Cart`",
      requirements: ["Image with alt text", "h3 product name", "Price paragraph", "'Add to Cart' button"],
      hints: ["Wrap everything in a single parent element.", "A $ followed by a number is plain text in JSX."],
      starterCode: stub("ProductCard"),
      solutionCode: `function ProductCard() {\n  return (\n    <div>\n      <img src="/headphones.jpg" alt="Wireless Headphones" />\n      <h3>Wireless Headphones</h3>\n      <p>$99.99</p>\n      <button>Add to Cart</button>\n    </div>\n  );\n}\n\nexport default ProductCard;\n`,
      explanation: "Product cards are a common UI pattern. In the Props level you'll make this card reusable for any product.",
      tests: [
        test("renders name, price and button", `renderComponent();\nscreen.getByRole("heading", { level: 3, name: "Wireless Headphones" });\nexpectText("$99.99");\nscreen.getByRole("button", { name: "Add to Cart" });`),
        hidden("renders the product image", `renderComponent();\nassertEqual(screen.getByRole("img", { name: "Wireless Headphones" }).getAttribute("src"), "/headphones.jpg");`),
      ],
    },
    {
      slug: "jsx-navbar",
      title: "Create a Navigation Bar",
      difficulty: "BEGINNER",
      tags: ["jsx", "semantic-html", "lists"],
      estimatedMinutes: 8,
      description:
        "Render a `<nav>` containing a `<ul>` with three list items, each holding a link: `Home` → `/`, `About` → `/about`, `Contact` → `/contact`.",
      requirements: ["Uses <nav>", "Links are inside list items", "Correct link text and hrefs"],
      hints: ["Navigation menus are usually lists of links.", "<nav><ul><li><a href=\"/\">Home</a></li>...</ul></nav>"],
      starterCode: stub("NavBar"),
      solutionCode: `function NavBar() {\n  return (\n    <nav>\n      <ul>\n        <li><a href="/">Home</a></li>\n        <li><a href="/about">About</a></li>\n        <li><a href="/contact">Contact</a></li>\n      </ul>\n    </nav>\n  );\n}\n\nexport default NavBar;\n`,
      explanation: "Marking up a menu as a list tells screen readers how many items it has ('list, 3 items').",
      tests: [
        test("renders the three links", `renderComponent();\nfor (const name of ["Home", "About", "Contact"]) screen.getByRole("link", { name });`),
        hidden(
          "links are list items inside a nav",
          `renderComponent();\nconst nav = screen.getByRole("navigation");\nassertEqual(within(nav).getAllByRole("listitem").length, 3);\nassertEqual(within(nav).getAllByRole("link").map((a) => a.getAttribute("href")), ["/", "/about", "/contact"]);`
        ),
      ],
      wrongSolutions: [`function NavBar() {\n  return (\n    <nav>\n      <a href="/">Home</a>\n      <a href="/about">About</a>\n      <a href="/contact">Contact</a>\n    </nav>\n  );\n}\n\nexport default NavBar;\n`],
    },
    {
      slug: "jsx-alert",
      title: "Create a Simple Alert",
      difficulty: "BEGINNER",
      tags: ["jsx", "accessibility", "aria"],
      estimatedMinutes: 5,
      description:
        "Render a message box with the text `Your changes have been saved.` Give it `role=\"alert\"` so screen readers announce it as soon as it appears.",
      requirements: ["Has role='alert'", "Contains the message"],
      hints: ["`role` is a normal attribute in JSX.", "<div role=\"alert\">...</div>"],
      starterCode: stub("SavedAlert"),
      solutionCode: `function SavedAlert() {\n  return <div role="alert">Your changes have been saved.</div>;\n}\n\nexport default SavedAlert;\n`,
      explanation: "ARIA roles describe what an element is for when there's no native HTML element that does. `alert` makes assistive technology read the content immediately.",
      tests: [
        test("renders the message", `renderComponent();\nexpectText("Your changes have been saved.");`),
        hidden("uses role=alert", `renderComponent();\nassertEqual(screen.getByRole("alert").textContent, "Your changes have been saved.");`),
      ],
      wrongSolutions: [`function SavedAlert() {\n  return <div>Your changes have been saved.</div>;\n}\n\nexport default SavedAlert;\n`],
    },
    {
      slug: "jsx-hero-section",
      title: "Create a Hero Section",
      difficulty: "BEGINNER",
      tags: ["jsx", "semantic-html"],
      estimatedMinutes: 8,
      description:
        "Render a landing-page hero inside a `<section>`:\n\n- `<h1>` `Build faster with React`\n- paragraph `Components, hooks, and a huge ecosystem.`\n- two buttons: `Get Started` and `Learn More`",
      requirements: ["Uses a <section>", "h1 heading", "Tagline paragraph", "Two buttons"],
      hints: ["Group the two buttons in a <div> if you like.", "Everything goes inside one <section>."],
      starterCode: stub("Hero"),
      solutionCode: `function Hero() {\n  return (\n    <section>\n      <h1>Build faster with React</h1>\n      <p>Components, hooks, and a huge ecosystem.</p>\n      <div>\n        <button>Get Started</button>\n        <button>Learn More</button>\n      </div>\n    </section>\n  );\n}\n\nexport default Hero;\n`,
      explanation: "JSX nests to whatever depth you need. A small inner <div> to group the buttons is fine.",
      tests: [
        test("renders heading and tagline", `renderComponent();\nscreen.getByRole("heading", { level: 1, name: "Build faster with React" });\nexpectText("Components, hooks, and a huge ecosystem.");`),
        hidden(
          "renders both buttons inside a section",
          `const { container } = renderComponent();\nconst section = container.querySelector("section");\nassert(section, "Expected a <section> element");\nassertEqual(within(section).getAllByRole("button").map((b) => b.textContent), ["Get Started", "Learn More"]);`
        ),
      ],
    },
    {
      slug: "jsx-static-login-form",
      title: "Create a Static Login Form",
      difficulty: "BEGINNER",
      tags: ["jsx", "forms", "accessibility"],
      estimatedMinutes: 10,
      description:
        "Build the markup for a login form (no behaviour yet):\n\n- a `<form>`\n- an email input labelled `Email`\n- a password input labelled `Password`\n- a submit button `Log In`",
      requirements: ["Email input with label", "Password input with label (type='password')", "Submit button 'Log In'"],
      hints: ["Connect each label to its input with htmlFor/id, or wrap the input in the label.", "type=\"password\" hides what's typed."],
      starterCode: stub("LoginForm"),
      solutionCode: `function LoginForm() {\n  return (\n    <form>\n      <label htmlFor="email">Email</label>\n      <input id="email" type="email" />\n      <label htmlFor="password">Password</label>\n      <input id="password" type="password" />\n      <button type="submit">Log In</button>\n    </form>\n  );\n}\n\nexport default LoginForm;\n`,
      explanation: "Getting the markup right — labels, input types, a submit button — makes the form accessible before any state is involved. Behaviour comes in the Forms level.",
      tests: [
        test("renders labelled inputs", `renderComponent();\nscreen.getByLabelText("Email");\nscreen.getByLabelText("Password");`),
        test("renders the submit button", `renderComponent();\nscreen.getByRole("button", { name: "Log In" });`),
        hidden(
          "uses correct input types",
          `renderComponent();\nassertEqual(screen.getByLabelText("Email").getAttribute("type"), "email");\nassertEqual(screen.getByLabelText("Password").getAttribute("type"), "password");`
        ),
      ],
      wrongSolutions: [`function LoginForm() {\n  return (\n    <form>\n      <label htmlFor="email">Email</label>\n      <input id="email" />\n      <label htmlFor="password">Password</label>\n      <input id="password" />\n      <button>Log In</button>\n    </form>\n  );\n}\n\nexport default LoginForm;\n`],
    },
  ],
};
