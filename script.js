window.onload = function () {

  // preload both backgrounds so they switch without delay
  var bgImages = ['pokemonbg.jpg', 'strawberrybg.jpg'];
  for (var i = 0; i < bgImages.length; i++) {
    var preload = new Image();
    preload.src = bgImages[i];
  }

  // grab the main elements we need throughout the whole script
  var container   = document.querySelector('.container');
  var bg          = document.getElementById('fullscreen-bg');
  var hairWrapper = document.querySelector('.hair-wrapper');

  // set the starting background image
  bg.style.backgroundImage = "url('pokemonbg.jpg')";

  // clicking the character body cycles through skin tones
  var skins     = ['base1.PNG', 'base2.png', 'base3.png'];
  var baseBody  = document.getElementById('base');
  var skinIndex = 0;
  baseBody.addEventListener('click', function () {
    // move to the next skin, wrap back to 0 when we reach the end
    skinIndex = (skinIndex + 1) % skins.length;
    baseBody.src = skins[skinIndex];
  });

  // keeps track of which hair is snapped onto the character
  var snappedHair = null;

  // returns true if the item is a clothing or hair piece that can snap to the character
  function isSnappable(el) {
    // list of all class names that are allowed to snap
    var snapClasses = ['hair-item', 'dress-item', 'top-item', 'shorts-item', 'acc-item', 'pokbag-item', 'shoe-item'];
    for (var i = 0; i < snapClasses.length; i++) {
      // if the element has any one of these classes it counts as snappable
      if (el.classList.contains(snapClasses[i])) {
        return true;
      }
    }
    return false;
  }

  // saves all item positions to the browser so they are remembered on next visit
  function savePositions() {
    var data = {};
    var items = document.querySelectorAll('.draggable');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      // only save items that are currently placed inside the main container and belong to the active tab
      if (item.parentElement === container && item.dataset.tab === activeTab) {
        // skip pokemon shoes since they are not used in the pokemon tab
        if (item.classList.contains('shoe-item') && item.dataset.tab === 'pokemon') { continue; }
        // store the left position, top position, and layer order
        data[item.alt] = {
          left:   item.style.left,
          top:    item.style.top,
          zIndex: item.style.zIndex
        };
      }
    }
    // convert the data object to a string and store it in the browser
    localStorage.setItem('outfit_positions', JSON.stringify(data));
  }

  // figures out where each item should land when dropped on the character
  function getSnapPos(el, baseCX, baseTop, baseH, baseW, scale) {

    // read custom snap offsets from the html if they exist
    var sx = null;
    var sy = null;
    if (el.dataset.snapX != null) { sx = parseFloat(el.dataset.snapX); }
    if (el.dataset.snapY != null) { sy = parseFloat(el.dataset.snapY); }

    // true visual size after scaling
    var w = el.offsetWidth  * scale;
    var h = el.offsetHeight * scale;

    if (el.classList.contains('hair-item')) {
      // default: center the hair horizontally on the character
      var snapX = 0.5;
      if (sx !== null) { snapX = sx; }
      // default: align hair to the very top of the character
      var snapY = baseTop;
      if (sy !== null) { snapY = baseTop + baseH * sy; }
      // use natural (unscaled) width here because strawberry hair uses transform-origin top center
      // which means the element box center stays fixed regardless of scale, so scale does not affect x placement
      return { x: baseCX - el.offsetWidth * snapX, y: snapY };
    }

    if (el.classList.contains('acc-item')) {
      // accessories go above everything else visually
      el.style.zIndex = 1002;
      var snapX = 0.5;
      if (sx !== null) { snapX = sx; }
      // default: sit just above the top of the character head
      var snapY = baseTop - h * 0.06;
      if (sy !== null) { snapY = baseTop + baseH * sy; }
      return { x: baseCX - w * snapX, y: snapY };
    }

    if (el.classList.contains('pokbag-item')) {
      // each bag has a different horizontal offset depending on its number
      var xOff = 0.30;
      if (el.dataset.bag === '1') { xOff =  0.11; }
      if (el.dataset.bag === '2') { xOff = -0.151; }
      if (el.dataset.bag === '3') { xOff = -0.151; }
      if (el.dataset.bag === '4') { xOff =  0.07; }
      // most bags sit at the same vertical position, bag 3 is slightly higher
      var yFrac = 0.365;
      if (el.dataset.bag === '3') { yFrac = 0.355; }
      return { x: baseCX + baseW * xOff - w / 2, y: baseTop + baseH * yFrac };
    }

    if (el.classList.contains('dress-item')) {
      // dress 2 is a wider image so it needs a different horizontal center
      var defaultX = 0.5;
      var defaultY = 0.372;
      if (el.classList.contains('dress-2')) {
        defaultX = 1 / 1.95;
        defaultY = 0.342;
      }
      var snapX = defaultX;
      if (sx !== null) { snapX = sx; }
      var snapY = defaultY;
      if (sy !== null) { snapY = sy; }
      return { x: baseCX - w * snapX, y: baseTop + baseH * snapY };
    }

    if (el.classList.contains('top-item')) {
      // tops sit around 37.5% down the character height
      var snapX = 0.5;
      if (sx !== null) { snapX = sx; }
      var snapY = 0.375;
      if (sy !== null) { snapY = sy; }
      return { x: baseCX - w * snapX, y: baseTop + baseH * snapY };
    }

    if (el.classList.contains('shorts-item')) {
      // shorts sit around 53% down the character height
      var snapX = 1 / 1.95;
      if (sx !== null) { snapX = sx; }
      var snapY = 0.531;
      if (sy !== null) { snapY = sy; }
      return { x: baseCX - w * snapX, y: baseTop + baseH * snapY };
    }

    if (el.classList.contains('shoe-item')) {
      // shoes go behind most items visually
      el.style.zIndex = 2;
      var snapX = 0.5;
      if (sx !== null) { snapX = sx; }
      // default: align shoes to the very bottom of the character
      var snapY = baseTop + baseH - h;
      if (sy !== null) { snapY = baseTop + baseH * sy; }
      return { x: baseCX - w * snapX, y: snapY };
    }

    // fallback for anything that does not match a specific type
    var snapX = 0.5;
    if (sx !== null) { snapX = sx; }
    var snapY = 0.002;
    if (sy !== null) { snapY = sy; }
    return { x: baseCX - w * snapX, y: baseTop + baseH * snapY };
  }

  // attach drag behavior to every draggable item on the page
  var allDraggables = document.querySelectorAll('.draggable');
  for (var d = 0; d < allDraggables.length; d++) {
    setupDrag(allDraggables[d]);
  }

  function setupDrag(el) {
    var dragging     = false; // true while the user is actively dragging
    var mouseDown    = false; // true while the mouse button is held down
    var startX       = 0;    // where the cursor was when the mouse first went down
    var startY       = 0;
    var offsetX      = 0;    // distance from cursor to the item's top left corner
    var offsetY      = 0;
    var ownTransform = '';   // the item's scale saved so it does not get lost during drag

    function startDrag(e) {
      // works for both mouse and touch screens
      var p = e;
      if (e.touches) { p = e.touches[0]; }
      mouseDown = true;
      dragging  = false;
      // save the starting position of the cursor
      startX  = p.clientX;
      startY  = p.clientY;
      // save how far the cursor is from the item's corner so it does not jump when dragged
      offsetX = p.clientX - el.offsetLeft;
      offsetY = p.clientY - el.offsetTop;
      e.preventDefault();
    }

    function onDrag(e) {
      // do nothing if the mouse button is not held
      if (!mouseDown) return;

      var p = e;
      if (e.touches) { p = e.touches[0]; }

      // this block only runs once at the very start of a drag
      if (!dragging) {
        // check how far the cursor has moved since the mouse went down
        var movedX = p.clientX - startX;
        var movedY = p.clientY - startY;
        var distanceMoved = Math.sqrt(movedX * movedX + movedY * movedY);

        // if barely moved treat it as a click not a drag
        if (distanceMoved < 5) return;

        // past this point we know the user is really dragging
        dragging = true;

        // save the current scale so the item keeps its size while dragging
        if (el.style.transform !== '') {
          ownTransform = el.style.transform;
        } else {
          ownTransform = getComputedStyle(el).transform;
        }

        if (isSnappable(el)) {
          // get the position of the container and the item on screen
          var containerBox = container.getBoundingClientRect();
          var itemBox      = el.getBoundingClientRect();

          // convert the item position to be relative to the container instead of the whole screen
          el.style.left = (itemBox.left - containerBox.left) + 'px';
          el.style.top  = (itemBox.top  - containerBox.top)  + 'px';

          // move the item into the container so it can be dragged anywhere on the canvas
          container.appendChild(el);

          // recalculate the offset after moving so the item does not jump
          offsetX = p.clientX - el.offsetLeft;
          offsetY = p.clientY - el.offsetTop;
        }

        // make the item float freely on top of everything else
        el.style.position  = 'absolute';
        el.style.zIndex    = 1000;
        el.style.cursor    = 'grabbing';
        el.style.transform = ownTransform;
      }

      // move the item to follow the cursor every frame
      el.style.left = (p.clientX - offsetX) + 'px';
      el.style.top  = (p.clientY - offsetY) + 'px';

      // stop the page from scrolling while dragging on touch screens
      e.preventDefault();
    }

    function stopDrag() {
      mouseDown = false;
      // if no drag happened this was just a click so do nothing
      if (!dragging) return;
      dragging = false;
      // change the cursor back to a grab hand
      el.style.cursor = 'grab';
      // non snappable items do not need snap logic
      if (!isSnappable(el)) return;

      var base     = document.getElementById('base');
      var baseRect = base.getBoundingClientRect();
      var cr       = container.getBoundingClientRect();

      // center x of the character and its top edge relative to the container
      var baseCX  = (baseRect.left - cr.left) + baseRect.width / 2;
      var baseTop = baseRect.top - cr.top;
      // current position of the item as a number without the px unit
      var elLeft  = parseFloat(el.style.left) || 0;
      var elTop   = parseFloat(el.style.top)  || 0;

      // get the item's visual scale from its transform
      // pokemon items have CSS transform so it comes through as matrix(), strawberry items have inline scale()
      var scale = 1;
      if (ownTransform && ownTransform !== 'none') {
        var matrixMatch = ownTransform.match(/matrix\(([^,]+)/);
        if (matrixMatch) {
          scale = Math.abs(parseFloat(matrixMatch[1])) || 1;
        } else {
          var scaleMatch = ownTransform.match(/scale\(([^)]+)/);
          if (scaleMatch) { scale = Math.abs(parseFloat(scaleMatch[1])) || 1; }
        }
      }

      // calculate the center point of the item
      var itemCenterX = elLeft + el.offsetWidth  * scale / 2;
      var itemCenterY = elTop  + el.offsetHeight * scale / 2;
      // calculate the center point of the character
      var charCenterX = baseCX;
      var charCenterY = baseTop + baseRect.height / 2;
      // calculate the straight line distance between the two centers
      var distX = itemCenterX - charCenterX;
      var distY = itemCenterY - charCenterY;
      var dist  = Math.sqrt(distX * distX + distY * distY);

      // if dropped too far away just leave it where it is
      if (dist >= 350) {
        savePositions();
        return;
      }

      // remember which hair is now on the character
      if (el.classList.contains('hair-item')) {
        snappedHair = el;
      }

      // slide the item smoothly into its correct snap position on the character
      var snap = getSnapPos(el, baseCX, baseTop, baseRect.height, baseRect.width, scale);
      el.style.transition = 'left 0.2s, top 0.2s';
      el.style.left = snap.x + 'px';
      el.style.top  = snap.y + 'px';
      // after the animation finishes remove the transition and save
      setTimeout(function () {
        el.style.transition = '';
        savePositions();
      }, 220);
    }

    // mouse events for desktop
    el.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    // touch events for mobile and tablets
    el.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', stopDrag);
    document.addEventListener('touchcancel', stopDrag);
  }

  // hair carousel: prev and next arrows cycle through hair options for the active tab
  var currentHair = 0;         // index of the currently shown hair
  var activeTab   = 'pokemon'; // which tab is currently open

  // returns all hair images that belong to the tab currently open
  function getTabHairItems() {
    return document.querySelectorAll(`.hair-item[data-tab="${activeTab}"]`);
  }

  // shows one hair at the given index and hides all the others
  function showHair(idx) {
    var items = getTabHairItems();
    for (var i = 0; i < items.length; i++) {
      if (i === idx) {
        items[i].classList.add('active');
      } else {
        items[i].classList.remove('active');
      }
    }
  }

  // puts snapped hair back into the wrapper before switching to a different one
  function removeSnappedHair() {
    if (!snappedHair) return;
    // put the hair image back inside the hair wrapper div
    hairWrapper.appendChild(snappedHair);
    // reset its position back to the top left of the wrapper
    snappedHair.style.left          = '0px';
    snappedHair.style.top           = '0px';
    // restore visibility and click ability
    snappedHair.style.opacity       = '';
    snappedHair.style.pointerEvents = '';
    snappedHair = null;
  }

  // previous arrow cycles the hair backwards
  document.getElementById('hair-prev').addEventListener('click', function () {
    removeSnappedHair();
    var items = getTabHairItems();
    // subtract 1 and wrap around to the last hair if we go below 0
    currentHair = (currentHair - 1 + items.length) % items.length;
    showHair(currentHair);
  });

  // next arrow cycles the hair forwards
  document.getElementById('hair-next').addEventListener('click', function () {
    removeSnappedHair();
    var items = getTabHairItems();
    // add 1 and wrap around to 0 if we go past the last hair
    currentHair = (currentHair + 1) % items.length;
    showHair(currentHair);
  });

  // tab system: switching tabs changes the background and swaps all visible items
  function getTabBackground(tab) {
    if (tab === 'pokemon')    { return 'pokemonbg.jpg'; }
    if (tab === 'strawberry') { return 'strawberrybg.jpg'; }
    return '';
  }

  function switchTab(tab) {
    removeSnappedHair();
    // update which tab is active so other functions know
    activeTab   = tab;
    currentHair = 0;

    // change the background image to match the tab
    bg.style.backgroundImage = `url('${getTabBackground(tab)}')`;
    bg.style.backgroundSize  = 'cover';

    // swap the tab class on the container so css can apply the right styles
    container.className = container.className.replace(/\btab-\w+\b/g, '').trim();
    container.classList.add(`tab-${tab}`);

    // show items for the active tab and hide everything else
    var allTabItems = document.querySelectorAll('[data-tab]:not(.tab-btn)');
    for (var i = 0; i < allTabItems.length; i++) {
      var item = allTabItems[i];
      if (item.dataset.tab === tab) {
        item.style.display = '';     // show it
      } else {
        item.style.display = 'none'; // hide it
      }
    }

    // put all hair items back into the wrapper and remove the active class
    var allHairItems = document.querySelectorAll('.hair-item');
    for (var i = 0; i < allHairItems.length; i++) {
      var hairEl = allHairItems[i];
      hairEl.classList.remove('active');
      hairEl.style.opacity       = '';
      hairEl.style.pointerEvents = '';
      // if the hair belongs to a different tab and is floating outside the wrapper put it back
      if (hairEl.dataset.tab !== tab && hairEl.parentElement !== hairWrapper) {
        hairWrapper.appendChild(hairEl);
        hairEl.style.left = '0px';
        hairEl.style.top  = '0px';
      }
    }

    // show the first hair for the new tab
    var firstHair = getTabHairItems()[0];
    if (firstHair) {
      firstHair.classList.add('active');
    }
  }

  // attach click events to each tab button
  var tabButtons = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < tabButtons.length; i++) {
    tabButtons[i].addEventListener('click', function () {
      // remove active from all buttons then add it to the one that was clicked
      var allBtns = document.querySelectorAll('.tab-btn');
      for (var j = 0; j < allBtns.length; j++) {
        allBtns[j].classList.remove('active');
      }
      this.classList.add('active');
      // switch the tab content to match the clicked button
      switchTab(this.dataset.tab);
    });
  }

  // default positions for pokemon items when there is no saved data
  var defaultPositions = {
    pokdress1: { left: '51px',  top: '198px', zIndex: '5' },
    pokdress2: { left: '91px',  top: '198px', zIndex: '4' },
    pokdress3: { left: '190px', top: '195px', zIndex: '3' },
    pokdress4: { left: '269px', top: '195px', zIndex: '2' },
    poktop1:   { left: '370px', top: '195px', zIndex: '5' },
    pokshort1: { left: '370px', top: '280px', zIndex: '1' },
    pokbag4:   { left: '212px', top: '550px', zIndex: '4' },
    pokbag2:   { left: '269px', top: '542px', zIndex: '3' },
    pokbag3:   { left: '320px', top: '550px', zIndex: '2' },
    pokbag1:   { left: '382px', top: '541px', zIndex: '1' },
  };

  // version key: bump this number whenever snap positions change so old saved data is cleared
  var SAVE_VERSION = '2';
  if (localStorage.getItem('outfit_version') !== SAVE_VERSION) {
    localStorage.removeItem('outfit_positions');
    localStorage.setItem('outfit_version', SAVE_VERSION);
  }

  // use saved positions if they exist otherwise use the defaults above
  var savedData = localStorage.getItem('outfit_positions');
  var positions;
  if (savedData) {
    positions = JSON.parse(savedData);
  } else {
    positions = defaultPositions;
  }

  // place each item at its saved position inside the container
  // only restore items that belong to the starting tab (pokemon)
  for (var alt in positions) {
    var pos   = positions[alt];
    var posEl = document.querySelector(`.draggable[alt="${alt}"]`);
    if (!posEl) { continue; }
    if (posEl.dataset.tab !== 'pokemon') { continue; }
    posEl.style.left     = pos.left;
    posEl.style.top      = pos.top;
    posEl.style.zIndex   = pos.zIndex;
    posEl.style.position = 'absolute';
    container.appendChild(posEl);
  }

  // run switchTab now so wrong-tab items from localStorage get hidden immediately
  switchTab('pokemon');
  document.querySelector('.tab-btn[data-tab="pokemon"]').classList.add('active');

  // wrapper divs should not intercept clicks meant for the items inside them
  var wrappers = document.querySelectorAll('.pokbag-wrapper, .shorts-wrapper, .dress-wrapper, .top-wrapper');
  for (var i = 0; i < wrappers.length; i++) {
    wrappers[i].style.pointerEvents = 'none';
  }

  // shrink or grow items that have a data-scale attribute in the html
  var scaledItems = document.querySelectorAll('.draggable[data-scale]');
  for (var i = 0; i < scaledItems.length; i++) {
    var scaleEl = scaledItems[i];
    // scale() shrinks or grows the image without changing its actual size in the html
    scaleEl.style.transform = `scale(${scaleEl.dataset.scale})`;
    // transformOrigin controls which point the scaling happens from
    if (scaleEl.dataset.scaleOrigin) {
      scaleEl.style.transformOrigin = scaleEl.dataset.scaleOrigin;
    } else {
      scaleEl.style.transformOrigin = 'top left';
    }
  }

  // clothing carousels: each one has prev and next buttons to cycle through outfit options
  var carousels = document.querySelectorAll('.clothes-carousel');
  for (var i = 0; i < carousels.length; i++) {
    setupCarousel(carousels[i]);
  }

  function setupCarousel(wrapper) {
    var items = wrapper.querySelectorAll('.draggable');
    // if there are no items in this carousel do nothing
    if (items.length === 0) return;
    var idx = 0; // tracks which item is currently shown

    // prev button goes to the previous item
    wrapper.querySelector('.clothes-prev').addEventListener('click', function () {
      items[idx].classList.remove('active'); // hide the current item
      idx = (idx - 1 + items.length) % items.length; // move index back, wrap around
      items[idx].classList.add('active'); // show the new item
    });

    // next button goes to the next item
    wrapper.querySelector('.clothes-next').addEventListener('click', function () {
      items[idx].classList.remove('active'); // hide the current item
      idx = (idx + 1) % items.length; // move index forward, wrap around
      items[idx].classList.add('active'); // show the new item
    });
  }

  // save button draws the outfit onto a hidden canvas and stores it so the game can use it as the player sprite
  document.getElementById('save-btn').addEventListener('click', function () {
    var baseEl = document.getElementById('base');
    // get the size and position of the character on screen
    var br     = baseEl.getBoundingClientRect();

    // create an invisible canvas the same size as the character image
    var canvas = document.createElement('canvas');
    canvas.width  = br.width;
    canvas.height = br.height;
    // ctx is the drawing tool we use to put images onto the canvas
    var ctx = canvas.getContext('2d');

    // draw the character body as the bottom layer
    ctx.drawImage(baseEl, 0, 0, br.width, br.height);

    // collect all clothing items that are currently inside the container
    var clothingEls   = document.querySelectorAll('.container > .draggable');
    var clothingArray = [];
    for (var i = 0; i < clothingEls.length; i++) {
      clothingArray.push(clothingEls[i]);
    }

    // sort by z index so items with lower numbers are drawn first and appear behind
    clothingArray.sort(function (a, b) {
      return (parseInt(a.style.zIndex) || 0) - (parseInt(b.style.zIndex) || 0);
    });

    // draw each clothing item at the position it is currently sitting on screen
    for (var i = 0; i < clothingArray.length; i++) {
      var clothingItem = clothingArray[i];
      var er = clothingItem.getBoundingClientRect();
      // subtract the character position so the drawing lines up correctly on the canvas
      ctx.drawImage(clothingItem, er.left - br.left, er.top - br.top, er.width, er.height);
    }

    // convert the canvas to a png image string and store it in the browser
    try {
      localStorage.setItem('outfit_sprite', canvas.toDataURL('image/png'));
    } catch (e) {}

    // show saved briefly then reset the button text
    var saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = 'Saved!';
    // show the play button now that an outfit has been saved
    document.getElementById('play-btn').style.display = '';
    setTimeout(function () {
      saveBtn.textContent = 'Save';
    }, 1500);
  });

};
