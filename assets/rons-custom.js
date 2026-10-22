/*
 * Ron's Pijamas – custom theme scripts
 *
 * Loaded globally from layout/theme.liquid with `defer`, as the last theme
 * script, so it runs after Dawn's global.js, pubsub.js and constants.js and
 * can use their helpers (e.g. subscribe(), PUB_SUB_EVENTS, debounce()).
 *
 * Keep all brand customisations here instead of editing Dawn's core files,
 * so future Dawn updates can be merged cleanly.
 */

/*
 * Sticky add to cart (sections/rons-sticky-atc.liquid)
 *
 * Watches the main product form's submit button. When it leaves the viewport
 * (scrolled past), the bar slides in. The bar mirrors the button's disabled
 * state and label, and the selected variant's price, and clicking it clicks
 * the real submit button so Dawn's product-form handles the add to cart.
 */
if (!customElements.get('rons-sticky-atc')) {
  class RonsStickyAtc extends HTMLElement {
    connectedCallback() {
      this.productInfo = document.querySelector(`product-info[data-product-id="${this.dataset.productId}"]`);
      if (!this.productInfo) return;

      this.sectionId = this.productInfo.dataset.section;
      this.stickyButton = this.querySelector('[data-sticky-button]');
      this.stickyButtonText = this.querySelector('[data-sticky-button-text]');
      this.stickyPrice = this.querySelector('[data-sticky-price]');
      this.stickyVariant = this.querySelector('[data-sticky-variant]');

      this.stickyButton.addEventListener('click', this.onClick.bind(this));
      this.bindMainButton();
      this.syncPrice();

      if (typeof subscribe === 'function') {
        this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (event.data.sectionId !== this.sectionId) return;
          if (this.stickyVariant && event.data.variant) this.stickyVariant.textContent = event.data.variant.title;
          // Dawn swaps the price markup synchronously before publishing; read it on the next frame to be safe.
          requestAnimationFrame(() => {
            this.syncPrice();
            this.syncButton();
          });
        });
      }
    }

    disconnectedCallback() {
      this.unsubscribe?.();
      this.observer?.disconnect();
      this.mutationObserver?.disconnect();
      this.setVisible(false);
    }

    get mainButton() {
      return document.getElementById(`ProductSubmitButton-${this.sectionId}`);
    }

    bindMainButton() {
      const button = this.mainButton;
      if (!button) return;

      this.observer = new IntersectionObserver(([entry]) => {
        // Only show once the button is above the viewport (scrolled past), not before reaching it.
        this.setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
      this.observer.observe(button);

      this.mutationObserver = new MutationObserver(() => this.syncButton());
      this.mutationObserver.observe(button, {
        attributes: true,
        attributeFilter: ['disabled', 'aria-disabled', 'class'],
        childList: true,
        characterData: true,
        subtree: true,
      });
      this.syncButton();
    }

    setVisible(visible) {
      this.classList.toggle('is-visible', visible);
      this.setAttribute('aria-hidden', String(!visible));
      this.stickyButton.tabIndex = visible ? 0 : -1;
      document.body.classList.toggle('rons-sticky-atc-visible', visible);
    }

    syncButton() {
      const button = this.mainButton;
      if (!button) return;
      const label = button.querySelector('span');
      this.stickyButton.disabled = button.hasAttribute('disabled');
      this.stickyButton.classList.toggle('loading', button.classList.contains('loading'));
      if (label) this.stickyButtonText.textContent = label.textContent.trim();
    }

    syncPrice() {
      const price = document.querySelector(`#price-${this.sectionId} .price`);
      if (price && this.stickyPrice) this.stickyPrice.innerHTML = price.outerHTML;
    }

    onClick() {
      const button = this.mainButton;
      if (!button || button.hasAttribute('disabled')) return;
      button.click();
    }
  }

  customElements.define('rons-sticky-atc', RonsStickyAtc);
}

/*
 * Low-stock indicator (snippets/rons-stock-status.liquid)
 *
 * Dawn re-renders the product section for the newly selected variant and
 * publishes it with the variant-change event. The stock message is copied
 * from that server-rendered HTML, so it always reflects real inventory.
 * While a new option is loading (or the combination doesn't exist) the
 * message is cleared so a stale count is never shown.
 */
if (typeof subscribe === 'function') {
  subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, (event) => {
    const productInfo = event.data?.target?.closest('product-info');
    const stock = productInfo && document.getElementById(`RonsStock-${productInfo.dataset.section}`);
    if (!stock) return;
    stock.innerHTML = '';
    stock.className = 'rons-stock rons-stock--none';
  });

  subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
    const { sectionId, html } = event.data;
    const destination = document.getElementById(`RonsStock-${sectionId}`);
    const source = html?.getElementById(`RonsStock-${sectionId}`);
    if (!destination || !source) return;
    destination.innerHTML = source.innerHTML;
    destination.className = source.className;
  });
}

/*
 * Gallery filtered by colour (main-product setting "Show only the selected
 * colour's images").
 *
 * An image belongs to a colour when its alt text equals that option value
 * (case-insensitive). Images whose alt text matches no option value are
 * shared and always shown. If no image matches the selected values, the full
 * gallery stays visible, so a product without alt texts is never emptied.
 */
function ronsFilterGallery(productInfo) {
  if (!productInfo || !productInfo.hasAttribute('data-rons-filter-gallery')) return;
  const sectionId = productInfo.dataset.section;
  const normalise = (value) => (value || '').trim().toLowerCase();

  const optionInputs = productInfo.querySelectorAll('variant-selects input[type="radio"], variant-selects option');
  const allValues = new Set(Array.from(optionInputs, (input) => normalise(input.value)).filter(Boolean));
  const selectedValues = new Set(
    Array.from(
      productInfo.querySelectorAll('variant-selects input[type="radio"]:checked, variant-selects option[selected]'),
      (input) => normalise(input.value),
    ),
  );

  const items = Array.from(
    productInfo.querySelectorAll(
      `#GalleryViewer-${sectionId} [data-media-id], #GalleryThumbnails-${sectionId} [data-target]`,
    ),
  );
  const colourOf = (item) => normalise(item.querySelector('img')?.getAttribute('alt'));
  const anyMatch = items.some((item) => selectedValues.has(colourOf(item)));

  items.forEach((item) => {
    const colour = colourOf(item);
    const belongsToOtherValue = anyMatch && allValues.has(colour) && !selectedValues.has(colour);
    item.classList.toggle('rons-media-hidden', belongsToOtherValue);
  });

  // Keep the active slide visible and let Dawn's sliders recount their pages.
  const gallery = productInfo.querySelector('media-gallery');
  const active = productInfo.querySelector(`#GalleryViewer-${sectionId} [data-media-id].is-active`);
  if (gallery && active && active.classList.contains('rons-media-hidden')) {
    const firstVisible = productInfo.querySelector(
      `#GalleryViewer-${sectionId} [data-media-id]:not(.rons-media-hidden)`,
    );
    if (firstVisible) gallery.setActiveMedia?.(firstVisible.dataset.mediaId, false);
  }
  productInfo
    .querySelectorAll(`#GalleryViewer-${sectionId}, #GalleryThumbnails-${sectionId}`)
    .forEach((slider) => slider.resetPages?.());
}

document.querySelectorAll('product-info[data-rons-filter-gallery]').forEach(ronsFilterGallery);
if (typeof subscribe === 'function') {
  subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
    ronsFilterGallery(document.querySelector(`product-info[data-section="${event.data.sectionId}"]`));
  });
}

/*
 * Gift message (main-product block): the field is only submitted with the
 * add-to-cart form while it is opened.
 */
document.addEventListener(
  'toggle',
  (event) => {
    if (!event.target.classList?.contains('rons-gift')) return;
    const field = event.target.querySelector('.rons-gift__input');
    if (!field) return;
    field.disabled = !event.target.open;
    if (event.target.open) field.focus();
  },
  true,
);

/*
 * Cart drawer complementary products (snippets/rons-cart-upsell.liquid):
 * add a single-variant product and refresh the drawer with Dawn's renderer.
 */
document.addEventListener('submit', (event) => {
  const form = event.target.closest?.('.rons-upsell__form');
  if (!form) return;
  const cartDrawer = document.querySelector('cart-drawer');
  if (!cartDrawer || typeof cartDrawer.renderContents !== 'function') return;
  event.preventDefault();

  const button = form.querySelector('button');
  const error = form.closest('.rons-upsell')?.querySelector('.rons-upsell__error');
  button.setAttribute('aria-disabled', 'true');
  button.classList.add('loading');

  const formData = new FormData(form);
  formData.append(
    'sections',
    cartDrawer.getSectionsToRender().map((section) => section.id),
  );
  formData.append('sections_url', window.location.pathname);
  const config = fetchConfig('javascript');
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  delete config.headers['Content-Type'];
  config.body = formData;

  fetch(`${routes.cart_add_url}`, config)
    .then((response) => response.json())
    .then((response) => {
      if (response.status) {
        if (error) {
          error.textContent = response.description || response.message;
          error.hidden = false;
        }
        return;
      }
      cartDrawer.renderContents(response);
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'rons-cart-upsell',
        productVariantId: formData.get('id'),
        cartData: response,
      });
    })
    .catch((e) => console.error(e))
    .finally(() => {
      button.removeAttribute('aria-disabled');
      button.classList.remove('loading');
    });
});
