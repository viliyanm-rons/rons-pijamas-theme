# Bulgarian navigation and pages – Shopify Admin setup

Everything below is configured in Shopify Admin. The theme only reads it; no links or page URLs are hardcoded.

## Already created through the Admin API (2026-11-08), not visible to customers yet

| Resource | Handle / URL | State |
|---|---|---|
| Menu "Главно меню (BG)" | `glavno-menyu` | Exists; the live theme still uses `main-menu` |
| Smart collection "Нощници" (product type = Нощници) | `/collections/noshtnitsi` | 1 product; **not published** to Online Store |
| Smart collection "Халати" (product type = Халати) | `/collections/halati` | 1 product; **not published** to Online Store |
| Page "За нас" | `/pages/za-nas` | **Hidden**; no template assigned yet |

Reused existing resources: blog "News" (`/blogs/news`, no articles), page "Contact" (`/pages/contact`, template `contact`), and `/collections/all` for "Всички продукти".

Menu structure (`glavno-menyu`):

1. Начало → home page
2. Продукти → Всички продукти (`/collections/all`), Нощници, Халати
3. Блог → blog News
4. Контакти → page Contact
5. За нас → page За нас

**Not included:** "Сатенени пижами", "Памучни пижами" and "Домашно облекло". No product matches them yet (no pajamas are tagged Сатен or Памук, and no product has the type Домашно облекло), so those collections would be empty. To add one later:

1. Tag the products, or set their product type.
2. Create a smart collection with that condition (Products › Collections › Create collection › Smart).
3. Publish it to the Online Store.
4. Add it under "Продукти" in Online Store › Navigation › Главно меню (BG).

## To activate (after the PR is approved and merged)

1. **Publish the two collections:** Products › Collections › Нощници › Publishing › Online Store. Repeat for Халати.
2. **За нас page:** Online Store › Pages › За нас.
   - Theme template: `page.about`.
   - Visibility: Visible.
   - Save.
3. **Contact page** (optional): Online Store › Pages › Contact. Rename the title to "Контакти". The template is already `contact`.
4. **Blog** (optional): Online Store › Blog posts › Manage blogs › News. Rename it to "Блог". The handle `/blogs/news` stays. The page heading "Блог" is a theme setting either way.
5. **Contact details:** Customize › Pages › Contact. Fill in the Имейл and Телефон blocks. Empty blocks are not shown. Social links are set in Theme settings › Social media.
6. **About page images:** Customize › Pages › page.about.
   - Choose a hero photo (optional; without one a text banner is shown).
   - Choose photos for "Сатен и вискоза" and "За всеки момент у дома". Each section stays hidden until it has a photo.
   - Review all texts.
7. **Contact form email:** messages go to the store's sender email (Settings › Notifications).

The menu switch itself happens when the PR is merged: the header setting changes from `main-menu` to `glavno-menyu` and the desktop menu type changes from Mega menu to Dropdown. Both can be changed back in Customize › Header.

## Theme templates

| Template | Assign to | Sections |
|---|---|---|
| `blog.json` | every blog (default) | Блог – списък със статии (`rons-main-blog`) |
| `article.json` | every article (default) | Dawn article with refined typography |
| `page.contact.json` | page Contact | Контакти – форма (`rons-contact`) |
| `page.about.json` | page За нас | Hero, intro, philosophy, two image + text sections, CTA |
