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
 *
 * Like Dawn's own price update, the source is looked up by the original
 * section id and the destination inside the product-info that changed. In
 * the quick-add window Dawn renames ids to "quickadd-…", so a lookup by the
 * original id alone would miss it.
 */
if (typeof subscribe === 'function') {
  let ronsStockProductInfo = null;

  subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, (event) => {
    const productInfo = event.data?.target?.closest('product-info');
    ronsStockProductInfo = productInfo || null;
    const stock = productInfo?.querySelector(`#RonsStock-${productInfo.dataset.section}`);
    if (!stock) return;
    stock.innerHTML = '';
    stock.className = 'rons-stock rons-stock--none';
  });

  subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
    const { sectionId, html } = event.data;
    const productInfo = ronsStockProductInfo?.isConnected
      ? ronsStockProductInfo
      : document.querySelector(`product-info[data-section="${sectionId}"]`);
    if (!productInfo) return;
    if ((productInfo.dataset.originalSection || productInfo.dataset.section) !== sectionId) return;
    const destination = productInfo.querySelector(`#RonsStock-${productInfo.dataset.section}`);
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

/*
 * Size guide modal (snippets/rons-size-guide-modal.liquid)
 *
 * - Size buttons highlight a size's summary and table row inside the guide
 *   only; they never change the product's variant.
 * - When the guide opens, the size currently selected on the product is
 *   highlighted (if the guide has it).
 * - "Избери размер X" is the explicit action: it selects that value through
 *   Dawn's own variant inputs (so price, stock and Add to cart update
 *   normally) and closes the guide.
 */
function ronsSizeGuideSelect(modal, index) {
  const selected = index === null ? null : String(index);
  modal.querySelectorAll('.rons-sg__size').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sizeIndex === selected));
  });
  modal.querySelectorAll('.rons-sg__summary').forEach((summary) => {
    summary.hidden = summary.dataset.sizeIndex !== selected;
  });
  modal.querySelectorAll('.rons-sg__table tbody tr').forEach((row) => {
    row.classList.toggle('is-selected', row.dataset.sizeIndex === selected);
  });
  const prompt = modal.querySelector('[data-size-prompt]');
  if (prompt) prompt.hidden = selected !== null;
}

function ronsSizeOptionContainer(sectionId) {
  const productInfo = document.querySelector(`product-info[data-section="${sectionId}"]`);
  return productInfo?.querySelector('.rons-size-guide__opener--option')?.closest('.product-form__input') || null;
}

document.addEventListener('click', (event) => {
  const opener = event.target.closest?.('[data-rons-size-guide-open]');
  if (opener) {
    const sectionId = opener.dataset.ronsSizeGuideOpen;
    const modal = document.getElementById(`SizeGuideModal-${sectionId}`);
    if (!modal) return;
    const container = ronsSizeOptionContainer(sectionId);
    const current = (
      container?.querySelector('input:checked')?.value ||
      container?.querySelector('select')?.value ||
      ''
    )
      .trim()
      .toLowerCase();
    const match = Array.from(modal.querySelectorAll('.rons-sg__size')).find(
      (button) => current && button.textContent.trim().toLowerCase() === current,
    );
    ronsSizeGuideSelect(modal, match ? match.dataset.sizeIndex : null);
    return;
  }

  const sizeButton = event.target.closest?.('.rons-sg__size');
  if (sizeButton) {
    ronsSizeGuideSelect(sizeButton.closest('[data-rons-size-guide]'), sizeButton.dataset.sizeIndex);
    return;
  }

  const apply = event.target.closest?.('.rons-sg__apply');
  if (apply) {
    const modal = apply.closest('[data-rons-size-guide]');
    const container = ronsSizeOptionContainer(modal.dataset.section);
    const value = apply.dataset.variantValue;
    const radio = Array.from(container?.querySelectorAll('input[type="radio"]') || []).find(
      (input) => input.value === value,
    );
    const select = container?.querySelector('select');
    if (radio && !radio.checked) {
      radio.click();
    } else if (!radio && select && select.value !== value) {
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    modal.hide?.();
  }
});

/* ---------------------------------------------------------------------------
 * Navigation
 * Desktop: dropdowns also open on mouse hover. Click, keyboard and Escape
 * keep Dawn's native <details> behaviour. A click on a hover-opened menu
 * keeps it open (instead of closing it) until focus or the pointer leaves.
 * Mobile drawer: first-level sub-menus expand as an accordion in place.
 * ------------------------------------------------------------------------- */
const ronsCanHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const ronsHoverTimers = new WeakMap();

function ronsSetHeaderMenu(menu, open, viaHover = false) {
  const details = menu?.querySelector(':scope > details');
  if (!details) return;
  if (viaHover && open) details.dataset.ronsHover = 'true';
  if (!open) delete details.dataset.ronsHover;
  if (details.open === open) return;
  details.open = open;
  details.querySelector(':scope > summary')?.setAttribute('aria-expanded', String(open));
}

// Hover target is the whole menu item, so a split item (link + caret
// button, e.g. Продукти) opens on the link too.
function ronsHoverMenu(target) {
  const item = target.closest?.('.header__inline-menu .list-menu--inline > li');
  return item?.querySelector(':scope > header-menu') || null;
}

document.addEventListener('mouseover', (event) => {
  if (!ronsCanHover.matches) return;
  const menu = ronsHoverMenu(event.target);
  if (!menu) return;
  clearTimeout(ronsHoverTimers.get(menu));
  document.querySelectorAll('.header__inline-menu header-menu').forEach((other) => {
    if (other !== menu) ronsSetHeaderMenu(other, false);
  });
  if (!menu.querySelector(':scope > details').open) ronsSetHeaderMenu(menu, true, true);
});

document.addEventListener('mouseout', (event) => {
  const menu = ronsHoverMenu(event.target);
  if (!menu || menu.parentElement.contains(event.relatedTarget)) return;
  const details = menu.querySelector(':scope > details');
  if (!details?.dataset.ronsHover) return;
  ronsHoverTimers.set(
    menu,
    setTimeout(() => ronsSetHeaderMenu(menu, false), 200),
  );
});

document.addEventListener(
  'click',
  (event) => {
    const summary = event.target.closest?.('summary');
    if (!summary) return;

    // Desktop: clicking a menu that hover already opened keeps it open.
    const headerMenu = summary.closest('.header__inline-menu header-menu');
    if (headerMenu && summary.parentElement.dataset.ronsHover) {
      event.preventDefault();
      event.stopPropagation();
      delete summary.parentElement.dataset.ronsHover;
      summary.setAttribute('aria-expanded', 'true');
      return;
    }

    // Mobile drawer: accordion instead of Dawn's slide-in sub-menu.
    if (summary.closest('#menu-drawer') && summary.matches('.menu-drawer__menu > li > details > summary')) {
      event.stopPropagation();
      const details = summary.parentElement;
      requestAnimationFrame(() => summary.setAttribute('aria-expanded', String(details.open)));
    }
  },
  true,
);

/* ---------------------------------------------------------------------------
 * Contact form (sections/rons-contact.liquid): Bulgarian validation messages.
 * Messages come from the section settings (data-rons-error). Shopify still
 * validates the form on the server.
 * ------------------------------------------------------------------------- */
const ronsEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Digits with optional +, spaces, dashes, dots, slashes and brackets; 6–15 digits.
const ronsPhonePattern = /^\+?[\d\s\-./()]{6,22}$/;

function ronsContactFieldValid(input) {
  const value = input.value.trim();
  if (!value) return input.hasAttribute('data-rons-optional');
  if (input.type === 'email') return ronsEmailPattern.test(value);
  if (input.type === 'tel') {
    const digits = value.replace(/\D/g, '').length;
    return ronsPhonePattern.test(value) && digits >= 6 && digits <= 15;
  }
  return true;
}

function ronsContactShowError(input, show) {
  const error = document.getElementById(input.getAttribute('aria-describedby'));
  if (show) {
    input.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = input.dataset.ronsError || '';
      error.hidden = false;
    }
  } else {
    input.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
  }
}

document.addEventListener('submit', (event) => {
  const form = event.target.closest?.('.rons-contact__form');
  if (!form) return;
  let firstInvalid = null;
  form.querySelectorAll('[data-rons-error]').forEach((input) => {
    const valid = ronsContactFieldValid(input);
    ronsContactShowError(input, !valid);
    if (!valid && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) {
    event.preventDefault();
    firstInvalid.focus();
  }
});

document.addEventListener('input', (event) => {
  const input = event.target.closest?.('.rons-contact__form [data-rons-error]');
  if (input && input.getAttribute('aria-invalid') === 'true' && ronsContactFieldValid(input)) {
    ronsContactShowError(input, false);
  }
});

document.addEventListener(
  'blur',
  (event) => {
    const input = event.target.closest?.('.rons-contact__form [data-rons-error]');
    if (input && input.value.trim() !== '') ronsContactShowError(input, !ronsContactFieldValid(input));
  },
  true,
);

/* ---------------------------------------------------------------------------
 * Quick add over product card images (snippets/rons-card-quick-add.liquid)
 * Adding to the cart is Dawn's <product-form> (cart drawer, inventory and
 * selling-policy checks); this only opens/closes the controls, puts the
 * chosen size into the form and reports the result.
 * ------------------------------------------------------------------------- */
class RonsQuickAdd extends HTMLElement {
  connectedCallback() {
    if (this.ready) return;
    this.ready = true;
    this.mode = this.dataset.mode;
    this.card = this.closest('.card-wrapper') || this.parentElement;
    this.trigger = this.querySelector('.rons-qa__trigger');
    this.openButton = this.querySelector('.rons-qa__open');
    this.form = this.querySelector('form');
    this.idInput = this.form ? this.form.querySelector('[name="id"]') : null;
    this.submitButton = this.querySelector('.rons-qa__submit');
    this.errorBox = this.querySelector('.rons-qa__error');
    this.sizes = Array.from(this.querySelectorAll('.rons-qa__size'));

    this.trigger?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.mode === 'modal') {
        this.querySelector('modal-opener button')?.click();
        return;
      }
      this.hasAttribute('data-open') ? this.close(true) : this.open();
    });
    this.openButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.open();
    });
    this.querySelector('.rons-qa__close')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.close(true);
    });
    this.sizes.forEach((button) =>
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!button.disabled) this.add(button.dataset.variantId, button);
      })
    );
    // Single variant: the button is the form's own submit button.
    if (this.mode === 'single') this.form?.addEventListener('submit', () => this.watch(null), true);

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.hasAttribute('data-open')) {
        event.stopPropagation();
        this.close(true);
      }
    });
    this.onLeave = () => {
      if (!this.busy && window.matchMedia('(hover: hover) and (pointer: fine)').matches) this.close(false);
    };
    this.card.addEventListener('mouseleave', this.onLeave);
    this.onOutside = (event) => {
      if (this.hasAttribute('data-open') && !this.contains(event.target) && !this.busy) this.close(false);
    };
    document.addEventListener('click', this.onOutside);

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      this.unsubscribers = [
        subscribe(PUB_SUB_EVENTS.cartUpdate, (data) => {
          if (this.pending && data?.source === 'product-form' && String(data.productVariantId) === this.pending) this.result = 'ok';
        }),
        subscribe(PUB_SUB_EVENTS.cartError, (data) => {
          if (this.pending && String(data?.productVariantId) === this.pending) this.result = 'error';
        }),
      ];
    }
  }

  disconnectedCallback() {
    this.card?.removeEventListener('mouseleave', this.onLeave);
    document.removeEventListener('click', this.onOutside);
    (this.unsubscribers || []).forEach((unsubscribe) => unsubscribe());
    this.ready = false;
  }

  open() {
    this.showError(false);
    this.setAttribute('data-open', '');
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.openButton?.setAttribute('aria-expanded', 'true');
    const first = this.mode === 'size' ? this.sizes.find((button) => !button.disabled) : this.submitButton;
    if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));
  }

  close(returnFocus) {
    if (!this.hasAttribute('data-open')) return;
    const hadFocus = this.contains(document.activeElement);
    this.removeAttribute('data-open');
    this.trigger?.setAttribute('aria-expanded', 'false');
    this.openButton?.setAttribute('aria-expanded', 'false');
    if (returnFocus || hadFocus) {
      const target = this.trigger && getComputedStyle(this.trigger).display !== 'none' ? this.trigger : this.openButton;
      target?.focus({ preventScroll: true });
    }
  }

  add(variantId, button) {
    if (!this.form || !this.idInput || this.busy) return;
    this.idInput.disabled = false;
    this.idInput.value = variantId;
    this.loadingButton = button;
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    if (!button.querySelector('.loading__spinner') && this.submitButton) {
      const spinner = this.submitButton.querySelector('.loading__spinner');
      if (spinner) button.appendChild(spinner.cloneNode(true)).classList.remove('hidden');
    }
    this.watch(String(variantId));
    if (this.form.requestSubmit) this.form.requestSubmit(this.submitButton || undefined);
    else this.submitButton?.click();
  }

  // Follows Dawn's submit until its loading state ends, then reports.
  watch(variantId) {
    this.showError(false);
    this.busy = true;
    this.pending = variantId || String(this.idInput?.value || '');
    this.result = null;
    const button = this.submitButton;
    if (!button) return;
    let started = false;
    const finish = () => {
      observer.disconnect();
      clearTimeout(this.watchTimer);
      setTimeout(() => {
        this.busy = false;
        if (this.loadingButton) {
          this.loadingButton.classList.remove('is-loading');
          this.loadingButton.removeAttribute('aria-busy');
          this.loadingButton.querySelector('.loading__spinner')?.remove();
          this.loadingButton = null;
        }
        if (this.result === 'ok') {
          this.close(false);
        } else {
          this.showError(true);
        }
        this.pending = null;
      }, 50);
    };
    const observer = new MutationObserver(() => {
      const loading = button.classList.contains('loading');
      if (loading) started = true;
      else if (started) finish();
    });
    observer.observe(button, { attributes: true, attributeFilter: ['class'] });
    this.watchTimer = setTimeout(finish, 20000);
  }

  showError(show) {
    if (!this.errorBox) return;
    this.errorBox.hidden = !show;
    if (show) this.setAttribute('data-open', '');
  }
}

if (!customElements.get('rons-quick-add')) customElements.define('rons-quick-add', RonsQuickAdd);

/* ---------------------------------------------------------------------------
 * Footer "Настройки на бисквитките" (sections/footer.liquid)
 * Opens Shopify's own cookie preferences (window.privacyBanner, loaded by
 * Shopify when the cookie banner is enabled in Settings › Customer privacy).
 * The link stays hidden unless that API is really available.
 * ------------------------------------------------------------------------- */
(function () {
  const buttons = () => document.querySelectorAll('[data-rons-cookie-prefs]');
  if (!buttons().length) return;
  const ready = () => window.privacyBanner && typeof window.privacyBanner.showPreferences === 'function';
  const reveal = () => buttons().forEach((button) => (button.hidden = false));
  let tries = 0;
  const check = () => {
    if (ready()) return reveal();
    if (++tries < 40) setTimeout(check, 250);
  };
  check();
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-rons-cookie-prefs]');
    if (!button || !ready()) return;
    event.preventDefault();
    try {
      window.privacyBanner.showPreferences();
    } catch (error) {
      console.error(error);
    }
  });
})();

/*
 * Customer reviews carousel (sections/rons-customer-reviews.liquid)
 *
 * The track is a native scroll-snap scroller, so touch swipe works without
 * JavaScript. This adds previous/next arrows, one dot per stop, optional
 * autoplay and "read more" for long reviews.
 *
 * Autoplay only runs while the carousel is on screen and the tab is visible;
 * it pauses on hover and keyboard focus and stops for good once the visitor
 * swipes, scrolls or uses the arrows/dots. It never runs for visitors who
 * prefer reduced motion. With fewer cards than fit, controls stay hidden.
 */
if (!customElements.get('rons-reviews-carousel')) {
  class RonsReviewsCarousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-track]');
      this.slides = Array.from(this.querySelectorAll('[data-slide]'));
      this.controls = this.querySelector('[data-controls]');
      this.prevButton = this.querySelector('[data-prev]');
      this.nextButton = this.querySelector('[data-next]');
      this.dotsWrapper = this.querySelector('[data-dots]');
      if (!this.track || this.slides.length === 0) return;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.interval = Math.max(parseInt(this.dataset.interval, 10) || 6000, 3000);
      this.autoplayWanted = this.dataset.autoplay === 'true';
      this.index = 0;
      this.positions = [0];
      this.state = { hover: false, focus: false, visible: false, stopped: false };

      this.slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} от ${this.slides.length}`));

      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.debounceFrame(() => {
        this.measure();
        this.setupReadMore();
      });
      this.stopByUser = () => this.stop();

      this.track.addEventListener('scroll', this.onScroll, { passive: true });
      ['pointerdown', 'touchstart', 'wheel'].forEach((type) =>
        this.track.addEventListener(type, this.stopByUser, { passive: true })
      );
      this.track.addEventListener('keydown', this.onKeydown.bind(this));
      this.prevButton.addEventListener('click', () => this.userGo(this.index - 1));
      this.nextButton.addEventListener('click', () => this.userGo(this.index + 1));
      this.addEventListener('mouseenter', () => this.setState({ hover: true }));
      this.addEventListener('mouseleave', () => this.setState({ hover: false }));
      this.addEventListener('focusin', () => this.setState({ focus: true }));
      this.addEventListener('focusout', (event) => {
        if (!this.contains(event.relatedTarget)) this.setState({ focus: false });
      });
      this.onVisibility = () => this.updateAutoplay();
      document.addEventListener('visibilitychange', this.onVisibility);
      window.addEventListener('resize', this.onResize);

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver((entries) => this.setState({ visible: entries[0].isIntersecting }), {
          threshold: 0.35,
        });
        this.observer.observe(this);
      }

      this.querySelectorAll('[data-review-more]').forEach((button) =>
        button.addEventListener('click', () => this.toggleReview(button))
      );

      if (window.Shopify && Shopify.designMode) {
        this.onBlockSelect = (event) => {
          const i = this.slides.findIndex((slide) => slide.contains(event.target));
          if (i < 0) return;
          this.stop();
          this.track.scrollTo({ left: this.slides[i].offsetLeft - this.slides[0].offsetLeft, behavior: 'auto' });
        };
        document.addEventListener('shopify:block:select', this.onBlockSelect);
      }

      this.measure();
      this.setupReadMore();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.setupReadMore());
    }

    disconnectedCallback() {
      this.clearTimer();
      if (this.observer) this.observer.disconnect();
      document.removeEventListener('visibilitychange', this.onVisibility);
      window.removeEventListener('resize', this.onResize);
      if (this.onBlockSelect) document.removeEventListener('shopify:block:select', this.onBlockSelect);
    }

    debounceFrame(fn) {
      let frame;
      return () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(fn);
      };
    }

    /* Scroll stops: each slide's start, capped at the furthest scroll position. */
    measure() {
      const maxScroll = this.track.scrollWidth - this.track.clientWidth;
      const origin = this.slides[0].offsetLeft;
      const stops = [];
      this.slides.forEach((slide) => {
        const left = Math.min(slide.offsetLeft - origin, maxScroll);
        if (stops.length === 0 || left - stops[stops.length - 1] > 2) stops.push(left);
      });
      this.positions = stops.length ? stops : [0];

      const scrollable = maxScroll > 2 && this.positions.length > 1;
      this.classList.toggle('rons-reviews__carousel--static', !scrollable);
      this.controls.hidden = !scrollable;
      this.track.setAttribute('tabindex', scrollable ? '0' : '-1');
      this.renderDots();
      this.onScroll();
      this.updateAutoplay();
    }

    renderDots() {
      if (this.dotsWrapper.childElementCount === this.positions.length) return;
      this.dotsWrapper.innerHTML = '';
      this.positions.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'rons-reviews__dot';
        dot.setAttribute('aria-label', `Отзив ${i + 1} от ${this.positions.length}`);
        dot.addEventListener('click', () => this.userGo(i));
        this.dotsWrapper.appendChild(dot);
      });
    }

    onScroll() {
      const left = this.track.scrollLeft;
      let closest = 0;
      this.positions.forEach((position, i) => {
        if (Math.abs(position - left) < Math.abs(this.positions[closest] - left)) closest = i;
      });
      this.index = closest;
      Array.from(this.dotsWrapper.children).forEach((dot, i) => dot.setAttribute('aria-current', String(i === closest)));
      this.prevButton.disabled = closest === 0;
      this.nextButton.disabled = closest === this.positions.length - 1;
    }

    goTo(i) {
      const last = this.positions.length - 1;
      const target = i > last ? 0 : Math.max(0, Math.min(i, last));
      this.track.scrollTo({
        left: this.positions[target],
        behavior: this.reducedMotion.matches ? 'auto' : 'smooth',
      });
    }

    userGo(i) {
      this.stop();
      this.goTo(i);
    }

    onKeydown(event) {
      if (event.target !== this.track) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        this.userGo(this.index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    }

    setState(change) {
      Object.assign(this.state, change);
      this.updateAutoplay();
    }

    stop() {
      this.state.stopped = true;
      this.updateAutoplay();
    }

    updateAutoplay() {
      const s = this.state;
      const run =
        this.autoplayWanted &&
        !this.reducedMotion.matches &&
        !this.controls.hidden &&
        s.visible &&
        !s.hover &&
        !s.focus &&
        !s.stopped &&
        !document.hidden &&
        !(window.Shopify && Shopify.designMode);
      if (run && !this.timer) {
        this.timer = setInterval(() => this.goTo(this.index + 1), this.interval);
      } else if (!run) {
        this.clearTimer();
      }
    }

    clearTimer() {
      clearInterval(this.timer);
      this.timer = null;
    }

    /* Long reviews are clamped to a few lines; the button shows the full text. */
    setupReadMore() {
      this.querySelectorAll('[data-review-more]').forEach((button) => {
        if (button.getAttribute('aria-expanded') === 'true') return;
        const text = document.getElementById(button.getAttribute('aria-controls'));
        if (!text) return;
        text.classList.add('is-clamped');
        const overflowing = text.scrollHeight - text.clientHeight > 2;
        if (!overflowing) text.classList.remove('is-clamped');
        button.hidden = !overflowing;
      });
    }

    toggleReview(button) {
      const text = document.getElementById(button.getAttribute('aria-controls'));
      const expand = button.getAttribute('aria-expanded') !== 'true';
      this.stop();
      text.classList.toggle('is-clamped', !expand);
      button.setAttribute('aria-expanded', String(expand));
      button.textContent = expand ? button.dataset.labelLess : button.dataset.labelMore;
    }
  }

  customElements.define('rons-reviews-carousel', RonsReviewsCarousel);
}
