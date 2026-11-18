(() => {
  const pixelId = '940045260820970';
  const consentKey = 'tc_guitarra_meta_consent';
  const sourceKey = 'tc_guitarra_campaign';
  const attributionKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','utm_adset','utm_ad','campaign_id','adset_id','ad_id'];
  const metaKeys = ['fbclid','fbc','fbp'];
  const product = {content_ids:['8017XZ8K07'],content_name:'Trucker Cap Você na Guitarra',content_type:'product',value:47,currency:'BRL'};
  const current = new URLSearchParams(location.search);
  const links = [...document.querySelectorAll('[data-checkout]')];
  const dialog = document.getElementById('preferences');
  const banner = document.getElementById('measurement');
  const storage = {
    read(key) { try { return localStorage.getItem(key); } catch { return null; } },
    write(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  let consent = storage.read(consentKey);
  let campaign = {};
  try { campaign = JSON.parse(storage.read(sourceKey)) || {}; } catch {}
  let loaded = false;
  let viewed = false;
  const milestones = new Set();
  const cookie = name => document.cookie.split('; ').find(entry => entry.startsWith(name + '='))?.slice(name.length + 1);

  function updateLinks() {
    const allowed = consent === 'granted' ? [...attributionKeys,...metaKeys] : attributionKeys;
    const params = {};
    for (const key of allowed) {
      const value = current.get(key) || (consent === 'granted' && campaign[key]);
      if (value) params[key] = value;
    }
    if (consent === 'granted') {
      if (current.has('fbclid') && campaign.fbclid !== current.get('fbclid') && !current.has('fbc')) delete params.fbc;
      const fbc = cookie('_fbc');
      const fbp = cookie('_fbp');
      if (params.fbclid && !params.fbc) {
        params.fbc = fbc?.endsWith('.' + params.fbclid) ? fbc : 'fb.1.' + Date.now() + '.' + params.fbclid;
      }
      if (fbp) params.fbp = fbp;
      campaign = params;
      storage.write(sourceKey, JSON.stringify(params));
    }
    for (const link of links) {
      const url = new URL('https://chk.eduzz.com/8017XZ8K07');
      for (const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
      link.href = url.href;
    }
  }

  function track(name, parameters = {}, custom = true) {
    if (consent !== 'granted' || !loaded) return;
    window.fbq(custom ? 'trackCustom' : 'track',name,{...product,...parameters});
  }

  function enablePixel() {
    if (!loaded) {
      const fbq = window.fbq = function (...args) {
        if (fbq.callMethod) fbq.callMethod.apply(fbq,args);
        else fbq.queue.push(args);
      };
      window._fbq = fbq;
      fbq.queue = [];
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.append(script);
      fbq('init',pixelId);
      loaded = true;
    }
    window.fbq('consent','grant');
    if (!viewed) {
      track('PageView',{},false);
      track('ViewContent',{},false);
      viewed = true;
    }
  }

  function setConsent(value) {
    consent = value;
    storage.write(consentKey,value);
    banner.hidden = true;
    if (consent === 'granted') enablePixel();
    else {
      if (loaded) window.fbq('consent','revoke');
      campaign = {};
      storage.write(sourceKey,'{}');
    }
    updateLinks();
  }

  banner.hidden = Boolean(consent);
  if (consent === 'granted') enablePixel();
  updateLinks();
  banner.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click',() => setConsent(button.dataset.consent)));
  document.getElementById('privacy').addEventListener('click',() => {
    dialog.returnValue = '';
    dialog.showModal();
  });
  dialog.addEventListener('close',() => {
    if (['granted','denied'].includes(dialog.returnValue)) setConsent(dialog.returnValue);
  });
  links.forEach(link => {
    for (const type of ['click','auxclick','contextmenu']) {
      link.addEventListener(type,event => {
        updateLinks();
        if (type === 'click' || (type === 'auxclick' && event.button === 1)) {
          track('CheckoutClick',{cta_location:link.dataset.checkout});
        }
      });
    }
  });
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click',() => track('PracticeModeSelect',{mode:button.dataset.mode}));
  });
  document.querySelectorAll('details').forEach((item,index) => {
    item.addEventListener('toggle',() => { if (item.open) track('FAQOpen',{question_index:index+1}); });
  });
  const observer = new IntersectionObserver(entries => {
    if (consent !== 'granted') return;
    for (const {isIntersecting,target} of entries) {
      if (isIntersecting) {
        track(target.id === 'oferta' ? 'OfferView' : 'DemoView');
        observer.unobserve(target);
      }
    }
  },{threshold:.4});
  ['modos','oferta'].forEach(id => observer.observe(document.getElementById(id)));
  window.addEventListener('scroll',() => {
    if (consent !== 'granted') return;
    const range = document.documentElement.scrollHeight - innerHeight;
    if (range <= 0) return;
    for (const percent of [25,50,75,90]) {
      if (!milestones.has(percent) && scrollY/range*100 >= percent) {
        milestones.add(percent);
        track('ScrollDepth',{percent});
      }
    }
  },{passive:true});
})();
