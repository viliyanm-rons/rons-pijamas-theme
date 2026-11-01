# Size guide system – Shopify Admin setup

The theme shows a size guide ("Кой е моят размер?") on product pages using data you manage in Shopify Admin. Measurements are never stored in the theme code or templates. These definitions must be created once in **Shopify Admin**; the theme cannot create them.

How the theme chooses a guide for a product:

1. Product metafield **Скрий таблицата с размери** (`custom.hide_size_guide`) is ticked → no guide.
2. Product metafield **Таблица с размери** (`custom.size_guide`) points to a Size Guide → that guide.
3. Otherwise → the Size Guide entry with **Основна таблица** ticked (the store default).

A guide is only shown when it has at least one size. Until a definition and an entry exist, product pages simply show no size-guide link.

## 1. Metaobject definition "Size Guides"

Settings › Custom data › Metaobjects › **Add definition**

- Name: `Size Guides`
- Type (handle): **`size_guide`** (must be exactly this)
- Access › **Storefronts: ON** (otherwise the theme can't read it)
- Leave "Publishable" off, or if you turn it on, set each entry to **Active**.

Fields. Use these exact **keys**; you can use the Bulgarian names as field names:

| Field name (Admin) | Key | Type | Required | Notes |
|---|---|---|---|---|
| Заглавие | `title` | Single line text | Yes | Shown as the guide title, e.g. "Дамски пижами – стандартна кройка". Set it as the entry's **display name**. |
| Основна таблица | `is_default` | True or false | No | Tick on **one** entry: the store default. |
| Описание | `description` | Multi-line text | No | Short text under the title. |
| Мерна единица | `unit` | Single line text | No | Usually `см`. If empty, `см` is shown. |
| Размери | `sizes` | Single line text, **List of values** | Yes | In order, e.g. `S`, `M`, `L`, `XL`. Must match the product's size values (e.g. `S`) for the "Избери размер" button. |
| Бюст | `bust` | Single line text, **List of values** | No | Same order as Размери, e.g. `84–88`. |
| Талия | `waist` | Single line text, **List of values** | No | Same order as Размери. |
| Ханш | `hips` | Single line text, **List of values** | No | Same order as Размери. |
| Допълнителна мярка – име | `garment_label` | Single line text | No | e.g. `Дължина на панталона`. |
| Допълнителна мярка | `garment` | Single line text, **List of values** | No | Same order as Размери. Shown only when the name above is filled. |
| Съвет за размера | `fit_advice` | Multi-line text | No | e.g. advice for between sizes. |
| Как да се измериш | `how_to_measure` | Multi-line text | No | Measuring instructions. |
| Илюстрация | `illustration` | File (images only) | No | Measuring illustration. |

Lists are matched by position: the 1st bust value belongs to the 1st size, and so on. A missing value is shown as "—". Text lists allow ranges such as `84–88`.

## 2. Product metafield definitions

Settings › Custom data › **Products** › Add definition

| Name | Namespace and key | Type | Storefront access |
|---|---|---|---|
| Таблица с размери | `custom.size_guide` | **Metaobject** → reference **Size Guides** (one entry) | ON |
| Скрий таблицата с размери | `custom.hide_size_guide` | **True or false** | ON |

If `custom.size_guide` already exists with another type (e.g. Page), delete or rename it first. The theme ignores any non-metaobject value and falls back to the default.

## 3. Everyday tasks

### A. Create or edit a size chart
Content › **Metaobjects** › Size Guides › **Add entry** (or open an entry)
1. Fill **Заглавие**, **Размери** (one value per size), **Бюст**, **Талия**, **Ханш** in the same order.
2. Optional: description, unit, extra measurement, fit advice, measuring text and illustration.
3. **Save**.

Suggested entries: "Дамски пижами – стандартна кройка", "Дамски пижами – свободна кройка", "Нощници", "Халати". Enter only your real measurements.

### B. Set the store default
Open the entry that most products use and tick **Основна таблица**, then Save. Make sure no other entry has it ticked (if several do, the first one found is used).

### C. Use a different chart for one product
Products › the product › **Metafields** (bottom of the page) › **Таблица с размери** › select the entry › Save.

### D. Change measurements once for all products
Edit the entry under Content › Metaobjects › Size Guides and Save. Every product that uses it (directly or as the default) shows the new values immediately. Nothing needs to be copied to products.

### E. Hide the guide for one product
Products › the product › Metafields › tick **Скрий таблицата с размери** › Save.

## 4. Theme Editor

Customize › Products › Default product › **Product information** › block **Size guide**:
- **Size option names**: which product options are sizes (default `Размер, Size`). The link appears beside that option.
- Link label (default "Кой е моят размер?") and all texts inside the guide (Bulgarian defaults).
- Removing the block turns the size guide off for that product template.

## 5. Preview checklist

- [ ] A product with no `custom.size_guide`: the link appears beside "Размер" and opens the **default** guide.
- [ ] A product with `custom.size_guide` set: it shows **that** guide.
- [ ] A product with **Скрий таблицата с размери** ticked: no link.
- [ ] Opening the guide highlights the size currently selected on the product.
- [ ] Clicking a size in the guide only highlights it; the product's size does not change.
- [ ] "Избери размер X" selects that size on the product (price, stock and Add to cart update) and closes the guide.
- [ ] Sizes in the guide that the product doesn't have show measurements but no "Избери размер" button.
- [ ] Escape and the × close the guide; Tab stays inside it while open.
- [ ] Editing an entry in Admin changes the guide on all linked products after a refresh.
- [ ] iPhone: the guide opens as a sheet from the bottom and the table scrolls sideways if needed.
