window.onload = function () {
  ['pokemonbg.jpg', 'strawberrybg.jpg', 'gachiakutabg.jpg'].forEach(src => { new Image().src = src; });

  const container= document.querySelector('.container');
  const bg= document.getElementById('fullscreen-bg');
  const hairWrapper = document.querySelector('.hair-wrapper');

  bg.style.backgroundImage = "url('pokemonbg.jpg')";

  // Skin cycle
  const skins    = ['base1.PNG', 'base2.png', 'base3.png'];
  const baseBody = document.getElementById('base');
  let skinIndex  = 0;
  baseBody.addEventListener('click', () => {
    baseBody.src = skins[skinIndex = (skinIndex + 1) % skins.length];
  });

  // Drag system
  let snappedHair = null;
  const SNAP_CLASSES = ['hair-item', 'dress-item', 'top-item', 'shorts-item', 'acc-item', 'pokbag-item'];
  const isSnappable  = el => SNAP_CLASSES.some(c => el.classList.contains(c));
  const pt = e  => e.touches ? e.touches[0] : e;

  document.querySelectorAll('.draggable').forEach(el => {
    let dragging = false, pending = false;
    let startX = 0, startY = 0, offsetX = 0, offsetY = 0;
    const ownTransform = getComputedStyle(el).transform;

    function startDrag(e) {
      const p = pt(e);
      pending = true;
      startX = p.clientX; startY = p.clientY;
      offsetX = p.clientX - el.offsetLeft;
      offsetY = p.clientY - el.offsetTop;
      e.preventDefault();
    }

    function onDrag(e) {
      if (!pending && !dragging) return;
      const p = pt(e);
      if (pending && !dragging) {
        if (Math.hypot(p.clientX - startX, p.clientY - startY) < 5) return;
        dragging = true; pending = false;
        if (isSnappable(el)) {
          const cr = container.getBoundingClientRect();
          const er = el.getBoundingClientRect();
          el.style.left = (er.left - cr.left) + 'px';
          el.style.top  = (er.top  - cr.top)  + 'px';
          container.appendChild(el);
          offsetX = p.clientX - el.offsetLeft;
          offsetY = p.clientY - el.offsetTop;
        }
        el.style.position  = 'absolute';
        el.style.zIndex    = 1000;
        el.style.cursor    = 'grabbing';
        el.style.transform = ownTransform;
      }
      if (dragging) {
        el.style.left = (p.clientX - offsetX) + 'px';
        el.style.top  = (p.clientY - offsetY) + 'px';
      }
      e.preventDefault();
    }

    function stopDrag() {
      pending = false;
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      if (!isSnappable(el)) return;

      const base       = document.getElementById('base');
      const baseRect   = base.getBoundingClientRect();
      const cr         = container.getBoundingClientRect();
      const baseCX     = (baseRect.left - cr.left) + baseRect.width  / 2;
      const baseCY     = (baseRect.top  - cr.top)  + baseRect.height / 2;
      const elLeft     = parseFloat(el.style.left) || 0;
      const elTop      = parseFloat(el.style.top)  || 0;

      let itemScale = 1;
      if (ownTransform && ownTransform !== 'none') {
        try { itemScale = Math.abs(new DOMMatrix(ownTransform).a); } catch(e) {}
      }

      if (Math.hypot(elLeft + el.offsetWidth * itemScale / 2 - baseCX, elTop + el.offsetHeight * itemScale / 2 - baseCY) >= 350) return;

      let snapLeft, snapTop;

      if (el.classList.contains('hair-item')) {
        snapLeft    = baseCX - el.offsetWidth / 2;
        snapTop     = (baseRect.top - cr.top) + el.offsetHeight * 0.001;
        snappedHair = el;
      } else if (el.classList.contains('acc-item')) {
        snapLeft        = baseCX - el.offsetWidth / 2;
        snapTop         = (baseRect.top - cr.top) - el.offsetHeight * 0.060;
        el.style.zIndex = 1002;
      } else if (el.classList.contains('pokbag-item')) {
        const bagHalfW = (el.offsetWidth * itemScale) / 2;
        const baseTop  = baseRect.top - cr.top;
        const bagNum   = el.dataset.bag;
        if (bagNum === '1') {
          snapLeft = baseCX + baseRect.width * 0.11 - bagHalfW;
          snapTop  = baseTop + baseRect.height * 0.365;
        } else if (bagNum === '2') {
          snapLeft = baseCX - baseRect.width * 0.151 - bagHalfW;
          snapTop  = baseTop + baseRect.height * 0.365;
        } else if (bagNum === '3') {
          snapLeft = baseCX - baseRect.width * 0.151 - bagHalfW;
          snapTop  = baseTop + baseRect.height * 0.355;
        } else if (bagNum === '4') {
          snapLeft = baseCX - baseRect.width * -0.07 - bagHalfW;
          snapTop  = baseTop + baseRect.height * 0.365;
        } else {
          snapLeft = baseCX + baseRect.width * 0.30 - bagHalfW;
          snapTop  = baseTop + baseRect.height * 0.65;
        }
      } 
      else if (el.classList.contains('dress-item')){
        snapLeft = baseCX - (el.offsetWidth * itemScale) / 2;
        snapTop  = (baseRect.top - cr.top) + baseRect.height * 0.372;
          if(el.classList.contains('dress-2')) {
            snapLeft = baseCX - (el.offsetWidth * itemScale) / 1.95;
            snapTop  = (baseRect.top - cr.top) + baseRect.height * 0.342;
        }
        }
        else if (el.classList.contains('top-item')){
        snapLeft = baseCX - (el.offsetWidth * itemScale) / 2;
        snapTop  = (baseRect.top - cr.top) + baseRect.height * 0.375;
        }
        else if (el.classList.contains('shorts-item')){
        snapLeft = baseCX - (el.offsetWidth * itemScale) / 1.95;
        snapTop  = (baseRect.top - cr.top) + baseRect.height * 0.531;
        }
      else {
        // snapLeft = baseCX - (el.offsetWidth * itemScale) / 1.95;
        // snapTop  = (baseRect.top - cr.top) + baseRect.height * 0.372;
        snapLeft = baseCX - (el.offsetWidth * itemScale) / 2;
        snapTop  = (baseRect.top - cr.top) + baseRect.height * 0.002;
      }

      el.style.transition = 'left 0.2s, top 0.2s';
      el.style.left = snapLeft + 'px';
      el.style.top  = snapTop  + 'px';
      setTimeout(() => { el.style.transition = ''; }, 220);
    }

    el.addEventListener('mousedown', startDrag);
    el.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    document.addEventListener('touchcancel', stopDrag);
  });

  // Hair carousel
  let currentHair = 0;
  let activeTab   = 'pokemon';

  const tabHairItems    = () => Array.from(document.querySelectorAll(`.hair-item[data-tab="${activeTab}"]`));
  const showHair        = idx => tabHairItems().forEach((item, i) => item.classList.toggle('active', i === idx));

  function removeSnappedHair() {
    if (!snappedHair) return;
    hairWrapper.appendChild(snappedHair);
    snappedHair.style.left = snappedHair.style.top = '0px';
    snappedHair.style.opacity = snappedHair.style.pointerEvents = '';
    snappedHair = null;
  }

  document.getElementById('hair-prev').addEventListener('click', () => {
    removeSnappedHair();
    const items = tabHairItems();
    showHair(currentHair = (currentHair - 1 + items.length) % items.length);
  });
  document.getElementById('hair-next').addEventListener('click', () => {
    removeSnappedHair();
    showHair(currentHair = (currentHair + 1) % tabHairItems().length);
  });

  // Tab system
  const tabBgs = {
    pokemon:    'pokemonbg.jpg',
    strawberry: 'strawberrybg.jpg',
    gachiakuta: 'gachiakutabg.jpg',
    doremi:     'dimg/bg.png'
  };

  function switchTab(tab) {
    removeSnappedHair();
    activeTab   = tab;
    currentHair = 0;

    bg.style.backgroundImage = `url('${tabBgs[tab] || 'dimg/bg.png'}')`;
    bg.style.backgroundSize  = 'cover';
    bg.classList.toggle('rotated-bg', tab === 'strawberry');

    container.className = container.className.replace(/\btab-\w+\b/g, '').trim();
    container.classList.add(`tab-${tab}`);

    document.querySelectorAll('[data-tab]:not(.tab-btn)').forEach(el => {
      el.style.display = el.dataset.tab === tab ? '' : 'none';
    });

    document.querySelectorAll('.hair-item').forEach(el => {
      el.classList.remove('active');
      el.style.opacity = el.style.pointerEvents = '';
      if (el.dataset.tab !== tab && el.parentElement !== hairWrapper) {
        hairWrapper.appendChild(el);
        el.style.left = el.style.top = '0px';
      }
    });

    const items = tabHairItems();
    if (items[0]) items[0].classList.add('active');
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      switchTab(btn.dataset.tab);
    });
  });

  container.classList.add('tab-pokemon');

  // Clothing carousels
  document.querySelectorAll('.clothes-carousel').forEach(wrapper => {
    const items = Array.from(wrapper.querySelectorAll('.draggable'));
    if (!items.length) return;
    let idx = 0;
    wrapper.querySelector('.clothes-prev').addEventListener('click', () => {
      items[idx].classList.remove('active');
      idx = (idx - 1 + items.length) % items.length;
      items[idx].classList.add('active');
    });
    wrapper.querySelector('.clothes-next').addEventListener('click', () => {
      items[idx].classList.remove('active');
      idx = (idx + 1) % items.length;
      items[idx].classList.add('active');
    });
  });

  // Save outfit
  document.getElementById('save-btn').addEventListener('click', () => {
    const items = [];
    document.querySelectorAll('.container > .draggable').forEach(el => {
      items.push({
        src:       el.getAttribute('src'),
        alt:       el.alt,
        classes:   el.className,
        left:      el.style.left,
        top:       el.style.top,
        zIndex:    el.style.zIndex,
        transform: getComputedStyle(el).transform
      });
    });

    localStorage.setItem('kimi_outfit', JSON.stringify({
      baseSrc: document.getElementById('base').getAttribute('src'),
      items
    }));

    const saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = 'Saved!';
    document.getElementById('play-btn').style.display = '';
    setTimeout(() => { saveBtn.textContent = 'Save'; }, 1500);
  });
};
