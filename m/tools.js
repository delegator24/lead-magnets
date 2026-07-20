// ── Инструменты рабочей тетради ─────────────────────────────────────────────
// Правило: инструмент обязан ДАВАТЬ то, чего человек не знал, — расчет, совет,
// предупреждение. Просто печатать введенное — не инструмент, а форма.
(function(){
 var БАРЬЕРЫ={
  quality:'Страх, что сделают хуже',
  control:'Страх потерять контроль',
  faster:'«Пока объяснишь — сам сделаешь»',
  irreplace:'«Без меня все встанет»',
  how:'Непонятно, как и с чего начать'
 };
 var $=function(id){return document.getElementById(id);};
 var зн=function(id){var э=$(id);return э?(э.value||'').trim():'';};
 var чис=function(id){return parseFloat(зн(id))||0;};
 // экранирование пользовательского текста — определено наверху, потому что
 // нужно и выбору задач, и своим задачам, и основе задания
 var экр=function(т){return String(т).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');};

 // ── персональный вход ───────────────────────────────────────────────────
 var сырое=(new URLSearchParams(location.search).get('b')||'').toLowerCase();
 var мой=Object.keys(БАРЬЕРЫ).filter(function(к){return сырое.indexOf(к)>=0;})[0];
 if(мой){
  $('mineText').textContent=БАРЬЕРЫ[мой]+' — ваш раздел отмечен в меню сверху';
  $('mine').classList.add('on');
  var вкл=document.querySelector('.tab[data-code="'+мой+'"]');
  if(вкл) вкл.classList.add('mine');
  var цель=$(мой);
  if(цель) setTimeout(function(){цель.scrollIntoView({behavior:'smooth',block:'start'});},1100);
 }

 // ── возврат в бота: во ТОТ ЖЕ, из которого пришел ───────────────────────
 // Ссылка из бота несет канал (&ch=tg|max) и токен внутри метки. Все кнопки
 // «написать нам» ведем обратно в его бота с меткой material_<токен>:
 // мост по токену приклеит диалог к той же сделке, бот по метке поймет,
 // что человек вернулся из материала, и спросит про задачу.
 // ch может прийти и кодом канала Salebot (#{client_type}): 1=Telegram, 20=MAX —
 // бот подставляет свою переменную, а слов tg/max он не знает
 var канал=((new URLSearchParams(location.search).get('ch')||'tg')+'').toLowerCase();
 канал=(канал==='max'||канал==='20')?'max':'tg';
 // Метка возврата — ЧИСТОЕ слово без токена: Salebot сравнивает условие с целой
 // меткой, и метку с токеном не узнает ни один режим сравнения (проверено 20.07).
 // Склейка не страдает: клиент уже привязан к сделке при первом старте.
 var меткаВозврата='material'+(канал==='max'?'max':'tg');
 var ссылкаБота=(канал==='max'?'https://max.ru/id2634102694_bot':'https://t.me/Delegator24_bot')
                +'?start='+меткаВозврата;
 document.querySelectorAll('a[href*="Delegator24_bot"]').forEach(function(а){
  а.href=ссылкаБота;
  if(канал==='max') а.textContent=а.textContent.replace('Telegram','MAX');
 });

 // ── прогресс чтения ─────────────────────────────────────────────────────
 var полоса=$('prog'), шаг=$('hStep'), части=[].slice.call(document.querySelectorAll('.part'));
 function перерисовать(){
  var h=document.documentElement, всего=h.scrollHeight-h.clientHeight;
  полоса.style.width=(всего>0?Math.min(100,h.scrollTop/всего*100):0)+'%';
 }
 addEventListener('scroll',перерисовать,{passive:true});
 setTimeout(перерисовать,60);

 // ── вкладки: один раздел на экране вместо общей портянки ────────────────
 // Это рабочая тетрадь с инструментами, а не статья: инструменту нужен экран.
 // Печать собирает все разделы обратно (см. @media print).
 document.body.classList.add('tabbed');
 function показатьРаздел(id,скроллить){
  var цель=$(id); if(!цель||!цель.classList.contains('part')) return;
  части.forEach(function(ч){ ч.classList.toggle('active',ч===цель); });
  document.querySelectorAll('.tab').forEach(function(t){
   t.classList.toggle('on',t.dataset.code===id);
  });
  шаг.textContent='Раздел '+цель.dataset.num+' из 6';
  try{ history.replaceState(null,'','#'+id); }catch(e){}
  if(скроллить!==false){
   var верх=цель.getBoundingClientRect().top+window.scrollY-104;
   window.scrollTo({top:Math.max(0,верх),behavior:'smooth'});
  }
  перерисовать();
 }
 // любая якорная ссылка на раздел — переключение вкладки: и меню сверху,
 // и «Следующий шаг», и ссылки из пустых пунктов плана
 document.addEventListener('click',function(e){
  var а=e.target.closest('a[href^="#"]'); if(!а) return;
  var id=(а.getAttribute('href')||'').slice(1);
  var цель=$(id);
  if(!цель||!цель.classList.contains('part')) return;
  e.preventDefault();
  показатьРаздел(id);
 });
 // стартовый раздел: боль из метки, иначе якорь из адреса, иначе первый
 показатьРаздел(
  (мой&&$(мой))?мой:(location.hash&&$(location.hash.slice(1))?location.hash.slice(1):'quality'),
  false);

 // ── плавная прокрутка: код взят с лендинга «Почему сам» один в один ──────
 // Важное место — deltaMode: часть мышей сообщает прокрутку в СТРОКАХ, а не
 // в пикселях. Без умножения на 16 страница еле ползет.
 (function(){
  if(!matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  if(matchMedia('(pointer:coarse)').matches) return;     // тач — родная физика

  var target=window.scrollY, current=window.scrollY, running=false;
  function maxY(){ return Math.max(0,document.documentElement.scrollHeight-window.innerHeight); }
  function loop(){
   current+=(target-current)*0.12;
   if(Math.abs(target-current)<0.4){
    current=target; window.scrollTo({top:current,behavior:'instant'}); running=false; return;
   }
   window.scrollTo({top:current,behavior:'instant'});
   requestAnimationFrame(loop);
  }
  addEventListener('wheel',function(e){
   if(e.ctrlKey) return;                                 // масштабирование не трогаем
   var поле=e.target.closest('.out, textarea');          // прокрутка внутри блока — своя
   if(поле && поле.scrollHeight>поле.clientHeight) return;
   e.preventDefault();
   var d=e.deltaY;
   if(e.deltaMode===1) d*=16;                            // строки → пиксели
   else if(e.deltaMode===2) d*=window.innerHeight;       // страницы → пиксели
   target=Math.max(0,Math.min(maxY(),target+d));
   if(!running){ running=true; current=window.scrollY; requestAnimationFrame(loop); }
  },{passive:false});
  addEventListener('scroll',function(){
   if(!running){ target=window.scrollY; current=window.scrollY; }
  });
 })();

 // Проявляем КАЖДЫЙ блок по мере въезда в экран — как на лендинге.
 // Раньше всплывала вся секция разом: нижние блоки «появлялись» задолго до того,
 // как человек до них доходил, и плавности не чувствовалось.
 var блоки=[].slice.call(document.querySelectorAll(
   '.part>*, .core, .hero>*, .final'));
 if(matchMedia('(prefers-reduced-motion: no-preference)').matches){
  блоки.forEach(function(б){ б.classList.add('rv'); });
  var глаз=new IntersectionObserver(function(вошли){
   вошли.forEach(function(з){
    if(з.isIntersecting){ з.target.classList.add('in'); глаз.unobserve(з.target); }
   });
  },{threshold:0,rootMargin:'0px 0px -8% 0px'});   // те же настройки, что на лендинге
  блоки.forEach(function(б){ глаз.observe(б); });
 }

 // ── память: все введенное переживает закрытие вкладки ───────────────────
 var КЛЮЧ='d24-mehanika', память={};
 try{ память=JSON.parse(localStorage.getItem(КЛЮЧ)||'{}'); }catch(e){}
 var тост=$('toast'), t=null;
 function сохранить(){
  try{
   localStorage.setItem(КЛЮЧ,JSON.stringify(память));
   тост.classList.add('on'); clearTimeout(t);
   t=setTimeout(function(){тост.classList.remove('on');},1200);
  }catch(e){}
 }
 // План пересобираем после ЛЮБОГО изменения — он и есть то, ради чего человек
 // заполняет инструменты. Раньше перехватывал функции обертками, но поля держали
 // ссылки на старые версии, и половина пунктов в план не попадала.
 function отозваться(после){
  после && после();
  if(typeof window.план==='function') window.план();
 }
 function следить(э,после){
  var к=э.id; if(!к) return;
  if(э.type==='checkbox'){
   if(память[к]) э.checked=true;
   э.addEventListener('change',function(){память[к]=э.checked;сохранить();отозваться(после);});
  }else{
   if(память[к]!==undefined) э.value=память[к];
   э.addEventListener('input',function(){память[к]=э.value;сохранить();отозваться(после);});
   э.addEventListener('change',function(){память[к]=э.value;сохранить();отозваться(после);});
  }
 }
 window.__следить=следить;

 function очистить(поля,после){
  поля.forEach(function(id){
   var э=$(id); if(!э) return;
   if(э.type==='checkbox') э.checked=false; else э.value='';
   delete память[id];
  });
  сохранить(); после&&после();
 }

 // ═══ 1. КОНСТРУКТОР ЗАДАНИЯ ════════════════════════════════════════════
 // Собирается вживую по мере ввода — не надо жать «собрать».
 // И проверяет критерии: «качественно» проверить может только автор задачи.
 // Слова, за которыми не стоит ничего проверяемого. Ищем в любом месте строки:
 // «чтобы было качественно» начинается не с «качественно» — а проблема та же.
 var ПУСТЫШКИ=/(качественн|хорошо|хороший|красив|нормальн|прилично|достойн|адекватн|грамотн|аккуратн|профессиональн|солидн|стильн|понравил|как надо|как обычно|на уровне|не хуже)/i;

 var ПОЛЯ_З=['q_res','q_who','q_crit','q_no','q_att','q_date'];

 window.задание=function(){
  var рез=зн('q_res'), кому=зн('q_who'), крит=зн('q_crit'),
      нельзя=зн('q_no'), прил=зн('q_att'), срок=зн('q_date');

  // предупреждение о непроверяемых критериях
  var плохие=крит.split('\n').map(function(с){return с.replace(/^[—\-•\s]+/,'').trim();})
                 .filter(function(с){return с && ПУСТЫШКИ.test(с);});
  var пред=$('q_warn');
  if(плохие.length){
   пред.innerHTML='<b>«'+плохие[0]+'»</b> — это не критерий. Проверить такое сможете только вы сами: '+
    'значит вы не передали задачу, а оставили себе приемку.<br>'+
    'Спросите себя: <i>что должно быть в работе, чтобы я точно сказал «нет»?</i> — и переверните ответ.';
   пред.classList.add('on');
  }else пред.classList.remove('on');

  var о=$('q_out');
  if(!рез && !крит){ о.classList.remove('on'); подсказка(); основа(); return; }

  var сп=function(t){return t.split('\n').map(function(с){return с.replace(/^[—\-•\s]+/,'').trim();})
                       .filter(Boolean).map(function(с){return '— '+с;}).join('\n');};

  var т='ЗАДАЧА\n'+(рез||'…')+'\n\n'+
        'ДЛЯ КОГО И ЗАЧЕМ\n'+(кому||'…')+'\n\n'+
        'СДЕЛАНО — ЭТО КОГДА\n'+(крит?сп(крит):'…');
  if(нельзя) т+='\n\nЧЕГО ДЕЛАТЬ НЕЛЬЗЯ\n'+сп(нельзя);
  if(прил)   т+='\n\nПРИЛОЖЕНО\n'+прил;
  if(срок)   т+='\n\nСРОК\n'+срок;
  т+='\n\n———\nПеред стартом перескажите задачу своими словами — сверим понимание.\n'+
     'Непонятное спрашивайте сразу: вопрос дешевле переделки.';
  о.textContent=т; о.classList.add('on');
  подсказка(); основа();
 };

 function подсказка(){
  var нет=[];
  if(!зн('q_res'))  нет.push('что должно получиться');
  if(!зн('q_crit')) нет.push('критерии готовности');
  if(!зн('q_date')) нет.push('срок');
  var п=$('q_miss');
  if(нет.length){ п.textContent='Не хватает: '+нет.join(', ')+'. Без этого задание вернется с переделкой.'; п.classList.add('on'); }
  else { п.textContent='Задание полное — можно отдавать.'; п.classList.add('on','ok'); }
 }
 window.сброситьЗадание=function(){ очистить(ПОЛЯ_З,задание); $('q_out').classList.remove('on'); };

 // Выбранная в разделе 5 задача предлагается основой задания одним нажатием —
 // не переписывать же ее руками из блока в блок.
 function основа(){
  var к=$('qFrom'); if(!к) return;
  var имя=window.__перваяЗадача||'';
  if(имя && !зн('q_res')){
   к.innerHTML='<span>Ваша первая задача: <b>'+экр(имя)+'</b></span>'+
    '<button class="chip" type="button" id="qFromBtn">Подставить</button>';
   к.classList.add('on');
   $('qFromBtn').onclick=function(){
    $('q_res').value=имя; память['q_res']=имя; сохранить();
    задание(); план();
    $('q_res').focus();
   };
  }else{
   к.classList.remove('on'); к.innerHTML='';
  }
 }

 // ═══ 2. СИСТЕМА КОНТРОЛЯ ═══════════════════════════════════════════════
 // Раньше тут были только «границы решений» — это про полномочия, а страх
 // не про них. Человек боится ослепнуть. Значит инструмент должен собрать
 // ему систему сигналов: сколько точек, что в отчете, что считать тревогой.
 window.контроль=function(){
  var вид=зн('k_kind'), цена=зн('k_risk'), опыт=зн('k_exp');
  var о=$('k_out');
  if(!вид||!цена||!опыт){ о.classList.remove('on'); return; }

  var точки=[], частота, флаги=[];

  // сверка понимания нужна всегда — на ней ловится «сделал не то»
  точки.push({к:'Сверка понимания',
              д:'До начала. Человек пересказывает задачу своими словами и говорит, как будет делать',
              в:'5 минут'});

  if(цена==='высокая'||опыт==='впервые'){
   точки.push({к:'Черновик',д:'На середине. Смотрите скелет, а не чистовик: структуру, логику, направление',в:'10 минут'});
  }
  if(цена==='высокая'&&опыт==='впервые'){
   точки.push({к:'Пробный кусок',д:'Первые 10% работы — до того, как сделано все. Ошибка здесь стоит копейки',в:'10 минут'});
  }
  точки.push({к:'Приемка',д:'По вашим критериям, галочками. Не «нравится», а «соответствует»',в:'10 минут'});

  if(вид==='регулярная'){
   частота=(опыт==='впервые')?'Первые две недели — раз в неделю. Дальше раз в две недели.'
                             :'Раз в две недели. Если два отчета подряд без сюрпризов — раз в месяц.';
  }else{
   частота='Разовая задача: отчет не нужен, хватает контрольных точек выше.';
  }

  флаги.push('Срок съехал, а вы узнали об этом сами, не от исполнителя');
  флаги.push('На сверке отвечают общими словами («все понял, сделаю») вместо пересказа задачи');
  if(вид==='регулярная') флаги.push('Пункт «где застрял» пустой две недели подряд — человек либо не работает, либо боится спрашивать');
  if(цена==='высокая')   флаги.push('Одна и та же ошибка второй раз: первый — недоработали критерии, второй — уже сигнал');

  var экономия=точки.reduce(function(с,т){return с+parseInt(т.в);},0);

  var h='<div class="res-h">Ваша система контроля</div>';
  h+='<div class="res-sub">'+точки.length+' контрольные точки, '+экономия+' минут вашего времени на задачу — вместо постоянного присмотра</div>';
  h+='<table class="res-t"><tr><th>Точка</th><th>Когда и что смотрите</th><th>Время</th></tr>';
  точки.forEach(function(т){ h+='<tr><td><b>'+т.к+'</b></td><td>'+т.д+'</td><td>'+т.в+'</td></tr>'; });
  h+='</table>';

  h+='<div class="res-h2">Отчет — три пункта</div><ol class="res-l">'+
     '<li><b>Что закрыто</b> — со ссылками на результат</li>'+
     '<li><b>Что в работе и когда будет</b> — если срок съехал, здесь же почему</li>'+
     '<li><b>Где застрял и что нужно от вас</b> — конкретный вопрос или решение</li></ol>'+
     '<div class="res-note">'+частота+'</div>';

  h+='<div class="res-h2">Вмешиваться, если</div><ul class="res-l">';
  флаги.forEach(function(ф){ h+='<li>'+ф+'</li>'; });
  h+='</ul>';

  h+='<div class="res-note warn-note">Это НЕ повод вмешиваться: «делает не так, как делал бы я». '+
     'Если результат соответствует критериям, способ — не ваше дело. Иначе вы передали не задачу, а свои руки.</div>';

  о.innerHTML=h; о.classList.add('on');
 };

 var ПОЛЯ_Г=['c_self','c_ask','c_me'];
 window.границы=function(){
  var сам=зн('c_self'), согл=зн('c_ask'), только=зн('c_me');
  var о=$('c_out');
  if(!сам&&!согл&&!только){ о.classList.remove('on'); return; }
  var сп=function(t){return t.split('\n').map(function(с){return с.replace(/^[—\-•\s]+/,'').trim();})
                       .filter(Boolean).map(function(с){return '— '+с;}).join('\n');};
  о.textContent='ГРАНИЦЫ РЕШЕНИЙ\n\nРЕШАЙ САМ, НЕ СПРАШИВАЯ\n'+(сам?сп(сам):'—')+
   '\n\nСОГЛАСУЙ СО МНОЙ\n'+(согл?сп(согл):'—')+
   '\n\nТОЛЬКО Я\n'+(только?сп(только):'—');
  о.classList.add('on');
 };
 window.сброситьГраницы=function(){ очистить(ПОЛЯ_Г,границы); $('c_out').classList.remove('on'); };

 // ═══ 3. ЦЕНА «ДЕЛАТЬ САМОМУ» ═══════════════════════════════════════════
 // Часы — абстракция. Деньги — нет.
 window.посчитать=function(){
  var раз=чис('f_times'), мин=чис('f_mins'), ставка=чис('f_rate');
  var о=$('f_out');
  if(!раз||!мин){ о.classList.remove('on'); return; }

  var часовВгод=Math.round(раз*мин*12/60);
  var дней=Math.round(часовВгод/8*10)/10;
  var передачаЧ=3;                                  // объяснить + два прогона с правками
  var окупится=Math.max(1,Math.ceil(передачаЧ*60/мин));
  var месяцев=Math.round(окупится/раз*10)/10;

  var h='<div class="big">'+часовВгод+' ч в год</div>'+
        '<div class="small">это '+дней+' рабочих дней, которые вы каждый год отдаете одной задаче</div>';

  if(ставка){
   var деньги=Math.round(часовВгод*ставка);
   var строка=деньги.toLocaleString('ru-RU');
   h+='<div class="money">'+строка+' ₽ в год</div>'+
      '<div class="small">столько стоит ваше время на этой задаче — по вашей же оценке</div>';
  }

  h+='<div class="verdict">Передача стоит примерно <b>3 часа</b>: объяснить плюс два прогона с правками. '+
     'Окупится на <b>'+окупится+'-й раз</b>' + (месяцев<=12? ' — это примерно <b>'+месяцев+' мес.</b>' : '') + '. '+
     'Дальше задача не ваша, а счетчик тикает только в вашу пользу.</div>';

  if(!ставка){
   h+='<div class="hint-in">Впишите, во сколько оцениваете свой час, — покажу цену в деньгах. Обычно это отрезвляет сильнее часов.</div>';
  }

  о.innerHTML=h; о.classList.add('on');
 };

 // ═══ 4. КАРТА НЕЗАМЕНИМОСТИ ════════════════════════════════════════════
 // Мало собрать список — надо выдать план действий по типам.
 var КАРТА=$('map');
 window.добавитьСтроку=function(){
  var i=КАРТА.children.length;
  var д=document.createElement('div');
  д.className='map-row';
  д.innerHTML=
   '<input id="m_w'+i+'" placeholder="Что встанет">'+
   '<input id="m_y'+i+'" class="m-why" placeholder="Почему завязано на вас">'+
   '<select id="m_t'+i+'">'+
     '<option value="">тип…</option>'+
     '<option>Доступ</option><option>Канал</option>'+
     '<option>Знание</option><option>Полномочия</option>'+
   '</select>'+
   '<button class="map-del" title="Убрать">×</button>';
  КАРТА.appendChild(д);
  д.querySelector('.map-del').onclick=function(){
   д.querySelectorAll('input,select').forEach(function(э){delete память[э.id];});
   д.remove(); сохранить(); карта();
  };
  д.querySelectorAll('input,select').forEach(function(э){ следить(э,карта); });
 };

 var ПЛАН={
  'Доступ':   {д:'Выдать права',        с:'один день', как:'Заведите второго администратора там, где вы сейчас единственный. Начните с самого критичного: банк, CRM, домен, почта'},
  'Канал':    {д:'Перенаправить поток', с:'один день', как:'Клиенты и подрядчики пишут не вам в личку, а на общий адрес или в общий чат. Ваше отсутствие перестает быть обрывом связи'},
  'Знание':   {д:'Записать один раз',   с:'три минуты голосом', как:'Наговорите, как это делается, — исполнитель расшифрует в инструкцию и будет вести ее сам'},
  'Полномочия':{д:'Не передавать',      с:'—',         как:'Это правда ваше: цена, обязательства, люди, стратегия. Незаменимость тут — норма, а не проблема'}
 };

 window.карта=function(){
  var строки=[].slice.call(КАРТА.querySelectorAll('.map-row')).map(function(р){
   return {что:(р.querySelector('input').value||'').trim(),
           тип:(р.querySelector('select').value||'')};
  }).filter(function(с){return с.что||с.тип;});

  var о=$('m_sum');
  var стипом=строки.filter(function(с){return с.тип;});
  if(!стипом.length){ о.classList.remove('on'); return; }

  var поТипам={};
  стипом.forEach(function(с){ (поТипам[с.тип]=поТипам[с.тип]||[]).push(с.что||'без названия'); });

  var лечится=стипом.filter(function(с){return с.тип!=='Полномочия';}).length;
  var ваше=стипом.length-лечится;

  var h='<div class="res-h">Ваша незаменимость: '+стипом.length+' пунктов</div>';
  h+='<div class="res-sub">'+
     (лечится? '<b>'+лечится+'</b> снимается за неделю — без найма и реорганизации. ' : '')+
     (ваше? '<b>'+ваше+'</b> — настоящая: это ваши решения, их и не надо передавать.' : 'Настоящей незаменимости нет: все перечисленное можно снять с себя.')+
     '</div>';

  h+='<div class="res-h2">План на неделю</div>';
  ['Доступ','Канал','Знание','Полномочия'].forEach(function(тип){
   if(!поТипам[тип]) return;
   var п=ПЛАН[тип];
   h+='<div class="plan-i'+(тип==='Полномочия'?' plan-keep':'')+'">'+
      '<div class="plan-h"><b>'+п.д+'</b><span>'+п.с+'</span></div>'+
      '<div class="plan-what">'+поТипам[тип].join(' · ')+'</div>'+
      '<div class="plan-how">'+п.как+'</div></div>';
  });
  о.innerHTML=h; о.classList.add('on');
 };

 // ═══ 5. С КАКОЙ ЗАДАЧИ НАЧАТЬ ══════════════════════════════════════════
 // Было: считал галочки, при ничьей брал первую молча. Стало: считает
 // выгоду в часах и риск, объясняет выбор, а при равенстве честно говорит,
 // что разницы нет.
 window.выбор=function(){
  var зад=[];
  for(var i=1;i<=3;i++){
   var имя=зн('h_n'+i);
   if(!имя) continue;
   var раз=чис('h_r'+i), мин=чис('h_m'+i);
   зад.push({
    имя:имя,
    р:раз, м:мин,
    часы:Math.round(раз*мин*12/60),
    риск:$('h_risk'+i).checked,     // ошибка дорогая
    ясно:$('h_clear'+i).checked     // знает, как примет работу
   });
  }
  var о=$('h_out');
  if(!зад.length){ о.classList.remove('on'); return; }

  // Для ПЕРВОЙ задачи важнее не выгода, а безопасность: первый прогон —
  // это отладка вашего описания. Провал на дорогой задаче закроет тему навсегда.
  зад.forEach(function(з){
   з.балл = (з.риск?0:100) + (з.ясно?50:0) + Math.min(з.часы,60);
   з.почему=[];
   if(!з.риск) з.почему.push('ошибка не критична'); else з.почему.push('ошибка дорогая');
   if(з.ясно)  з.почему.push('знаете, как примете работу'); else з.почему.push('еще не знаете, как примете работу');
   if(з.часы)  з.почему.push('высвободит '+з.часы+' ч в год');
  });
  var по=зад.slice().sort(function(a,b){return b.балл-a.балл;});
  var лучш=по[0];
  var ничья=по.length>1 && (по[0].балл-по[1].балл)<=10;
  // рекомендацию запоминаем: итоговый план берет ЕЕ, а не первое заполненное поле
  window.__перваяЗадача=лучш?лучш.имя:'';

  // ── введенное один раз перетекает само: не заставляем переписывать ──────
  if(лучш){
   // числа задачи → счетчик цены (только в пустые поля, выбор человека не трогаем)
   if(лучш.р&&лучш.м&&!зн('f_times')&&!зн('f_mins')){
    $('f_times').value=лучш.р; память['f_times']=String(лучш.р);
    $('f_mins').value=лучш.м;  память['f_mins']=String(лучш.м);
    сохранить(); посчитать();
   }
   // цена ошибки → система контроля
   if(!зн('k_risk')){
    $('k_risk').value=лучш.риск?'высокая':'низкая';
    память['k_risk']=$('k_risk').value; сохранить();
   }
   // задача с повторами → регулярная
   if(!зн('k_kind')&&лучш.р>=1){
    $('k_kind').value='регулярная'; память['k_kind']='регулярная'; сохранить();
   }
   контроль();
  }
  основа();   // и предлагаем ее основой в конструкторе задания

  var h='<div class="res-h">Кандидаты</div><table class="res-t">'+
        '<tr><th>Задача</th><th>Высвободит</th><th>Ошибка</th><th>Знаю, как проверю</th></tr>';
  по.forEach(function(з){
   h+='<tr'+(з===лучш&&!ничья?' class="win"':'')+'><td><b>'+з.имя+'</b></td>'+
      '<td>'+(з.часы?з.часы+' ч/год':'—')+'</td>'+
      '<td>'+(з.риск?'дорогая':'дешевая')+'</td>'+
      '<td>'+(з.ясно?'да':'нет')+'</td></tr>';
  });
  h+='</table>';

  if(лучш.риск && по.every(function(з){return з.риск;})){
   h+='<div class="res-note warn-note"><b>Все задачи с дорогой ошибкой.</b> Для первого прогона это плохо: '+
      'провал закроет тему делегирования насовсем. Поищите что-то попроще — рутину, где ошибка стоит копейки. '+
      'Если такого нет вообще, начните с <b>«'+лучш.имя+'»</b>, но разбейте ее: отдайте сначала кусок, а не целиком.</div>';
  }else if(ничья){
   var имена=по.filter(function(з){return (по[0].балл-з.балл)<=10;}).map(function(з){return '«'+з.имя+'»';});
   h+='<div class="res-note"><b>'+имена.join(' и ')+' равнозначны — берите любую.</b> '+
      'Разницы нет: обе безопасны для первого прогона. Не тратьте время на выбор, '+
      'ценность в том, чтобы начать, а не в том, чтобы начать идеально.</div>';
  }else{
   h+='<div class="res-note ok-note"><b>Начинайте с «'+лучш.имя+'».</b> '+лучш.почему.join(', ')+'. '+
      (лучш.часы? 'Это '+Math.round(лучш.часы/8*10)/10+' рабочих дней в год, которые вернутся к вам. ' : '')+
      'Первый прогон — отладка вашего описания, а не проверка человека: поэтому важнее, чтобы ошибка была дешевой, '+
      'чем чтобы задача была крупной.</div>';
  }
  о.innerHTML=h; о.classList.add('on');
 };

 // ── подключаем поля ─────────────────────────────────────────────────────
 document.querySelectorAll('#quality .tool input, #quality .tool textarea')
   .forEach(function(э){ следить(э,задание); });
 document.querySelectorAll('#control .tool select').forEach(function(э){ следить(э,контроль); });
 document.querySelectorAll('#control .tool textarea').forEach(function(э){ следить(э,границы); });
 document.querySelectorAll('#faster .tool input').forEach(function(э){ следить(э,посчитать); });
 document.querySelectorAll('#how .cand input').forEach(function(э){ следить(э,выбор); });
 document.querySelectorAll('.check:not(.z) input').forEach(function(э){ следить(э); });

 // карта: восстанавливаем сохраненные строки
 var было=0;
 for(var к in память) if(/^m_w\d+$/.test(к)) было++;
 for(var i=0;i<Math.max(3,было);i++) добавитьСтроку();

 // первый пересчет
 задание(); контроль(); границы(); посчитать(); карта(); выбор();

 // ═══ БИБЛИОТЕКА КРИТЕРИЕВ ══════════════════════════════════════════════
 // Самое трудное — сформулировать первый критерий. Даем готовые: клик добавляет
 // его прямо в конструктор задания, дальше человек правит под себя.
 document.querySelectorAll('.chip[data-crit]').forEach(function(ч){
  ч.addEventListener('click',function(){
   var поле=$('q_crit');
   var было=(поле.value||'').trim();
   var строки=было?было.split('\n'):[];
   var новый=ч.dataset.crit;
   if(строки.indexOf(новый)>=0) return;                 // уже добавлен
   строки.push(новый);
   поле.value=строки.join('\n');
   память['q_crit']=поле.value; сохранить();
   задание(); план();
   ч.classList.add('added');
   setTimeout(function(){ч.classList.remove('added');},900);
   поле.scrollIntoView({behavior:'smooth',block:'center'});
  });
 });

 // ═══ ЧТО ВООБЩЕ ПЕРЕДАЮТ ═══════════════════════════════════════════════
 // Частый затык не «как», а «что». Отмеченное попадает в итоговый план.
 var ЗАДАЧИ={};
 document.querySelectorAll('.check.z input').forEach(function(в){
  ЗАДАЧИ[в.id]=в.parentNode.querySelector('span:last-child').textContent.trim();
 });
 // список не может предусмотреть все — свои задачи человек вписывает сам,
 // они хранятся так же, как и галочки, и живут наравне с готовыми
 var КАСТОМ=[];
 try{ КАСТОМ=JSON.parse(память['z_custom']||'[]'); }catch(e){}
 function кастомЗапомнить(){ память['z_custom']=JSON.stringify(КАСТОМ); сохранить(); }
 function кастомРендер(){
  var ул=$('zCustom'); if(!ул) return;
  ул.innerHTML=КАСТОМ.map(function(имя,i){
   return '<li class="zc"><span class="zc-dot"></span><span class="zc-n">'+экр(имя)+'</span>'+
          '<button class="map-del" type="button" data-i="'+i+'" title="Убрать">×</button></li>';
  }).join('');
 }
 var добавитьСвою=function(){
  var п=$('zAdd'); if(!п) return;
  var имя=(п.value||'').trim();
  if(!имя) return;
  if(КАСТОМ.indexOf(имя)<0) КАСТОМ.push(имя);
  п.value='';
  кастомЗапомнить(); кастомРендер(); задачи();
 };
 if($('zAddBtn')) $('zAddBtn').addEventListener('click',добавитьСвою);
 if($('zAdd')) $('zAdd').addEventListener('keydown',function(e){
  if(e.key==='Enter'){ e.preventDefault(); добавитьСвою(); }
 });
 if($('zCustom')) $('zCustom').addEventListener('click',function(e){
  var к=e.target.closest('.map-del'); if(!к) return;
  КАСТОМ.splice(+к.dataset.i,1);
  кастомЗапомнить(); кастомРендер(); задачи();
 });

 window.мои_задачи=function(){
  return Object.keys(ЗАДАЧИ).filter(function(id){var э=$(id);return э&&э.checked;})
               .map(function(id){return ЗАДАЧИ[id];})
               .concat(КАСТОМ);
 };
 window.задачи=function(){
  var сп=мои_задачи();
  var о=$('z_out');

  // отмеченное превращается в кнопки в инструменте выбора: нажал — подставилось.
  // Без этого человеку приходилось помнить и перепечатывать — это было неудобно.
  var пик=$('hPick');
  if(пик){
   пик.innerHTML=сп.length
    ? '<div class="pick-h">Ваши задачи из списка выше — нажмите, чтобы подставить:</div>'+
      сп.map(function(имя){return '<button class="chip" type="button" data-task="'+экр(имя)+'">'+экр(имя)+'</button>';}).join('')
    : '';
  }

  if(!сп.length){ о.classList.remove('on'); план(); return; }
  var часовГод=сп.length*48;                            // час в неделю ≈ 48 ч в год на задачу
  о.innerHTML='<div class="res-h">Вы делаете сами: '+сп.length+' задач</div>'+
   '<div class="res-sub">Даже если каждая забирает всего час в неделю, это около <b>'+
   часовГод+' часов в год</b> — примерно <b>'+Math.round(часовГод/8)+' рабочих дней</b>.</div>'+
   '<div class="res-note">Ниже выберите ту, с которой начнете, — ваши задачи уже там, кнопками. '+
   'Берите не самую тяжелую, а самую <b>безопасную</b>: первый прогон это отладка вашего описания.</div>';
  о.classList.add('on');
  план();
 };
 document.querySelectorAll('.check.z input').forEach(function(в){ следить(в,задачи); });

 // нажатие на кнопку-задачу: подставляем в первое свободное место кандидата
 if($('hPick')) $('hPick').addEventListener('click',function(e){
  var к=e.target.closest('.chip'); if(!к) return;
  var имя=к.dataset.task;
  var занятые=['h_n1','h_n2','h_n3'].map(зн);
  if(занятые.indexOf(имя)>=0) return;                   // уже стоит
  var слот=['h_n1','h_n2','h_n3'].filter(function(id){return !зн(id);})[0];
  var зам=$('hPickNote');
  if(!слот){
   if(зам){ зам.textContent='Все три места заняты — освободите одно и нажмите снова.'; зам.classList.add('on'); }
   return;
  }
  if(зам) зам.classList.remove('on');
  $(слот).value=имя; память[слот]=имя; сохранить();
  выбор(); план();
  к.classList.add('added');
  setTimeout(function(){к.classList.remove('added');},900);
  var число=$(слот.replace('_n','_r'));                 // курсор сразу в «раз в месяц»
  if(число) число.focus();
 });
 кастомРендер();

 // ═══ ИТОГОВЫЙ ПЛАН ═════════════════════════════════════════════════════
 // Человек заполнил пять инструментов — и раньше уходил ни с чем.
 // Здесь все собирается в один документ: скопировал и отправил помощнику.
 window.план=function(){
  var сетка=$('planGrid'); if(!сетка) return;

  var задачи_сп=мои_задачи();
  var первая=(window.__перваяЗадача||зн('h_n1')||зн('h_n2')||зн('h_n3'));
  var часы=(function(){
   var р=чис('f_times'), м=чис('f_mins');
   return (р&&м)?Math.round(р*м*12/60):0;
  })();
  var ставка=чис('f_rate');
  var задание_т=($('q_out')&&$('q_out').classList.contains('on'))?$('q_out').textContent:'';
  var контроль_есть=$('k_out')&&$('k_out').classList.contains('on');
  var карта_сп=[].slice.call(document.querySelectorAll('#map .map-row')).map(function(р){
   var что=(р.querySelector('input').value||'').trim();
   var тип=(р.querySelector('select').value||'');
   return что&&тип?{что:что,тип:тип}:null;
  }).filter(Boolean);

  var пункты=[
   {к:'Что я делаю сам',    ок:задачи_сп.length>0,
    з:задачи_сп.length?задачи_сп.length+' задач отмечено':'',
    куда:'#how', зачем:'отметьте в списке «Что вообще передают»'},
   {к:'Первая задача',      ок:!!первая, з:первая||'',
    куда:'#how', зачем:'выберите в разделе «С чего начать»'},
   {к:'Цена бездействия',   ок:часы>0,
    з:часы?(часы+' ч в год'+(ставка?' · '+(часы*ставка).toLocaleString('ru-RU')+' ₽':'')):'',
    куда:'#faster', зачем:'посчитайте в разделе «Быстрее самому»'},
   {к:'Готовое задание',    ок:!!задание_т, з:задание_т?'собрано':'',
    куда:'#quality', зачем:'соберите в конструкторе задания'},
   {к:'Система контроля',   ок:!!контроль_есть, з:контроль_есть?'настроена':'',
    куда:'#control', зачем:'соберите в разделе «Контроль»'},
   {к:'Что мешает',         ок:карта_сп.length>0,
    з:карта_сп.length?карта_сп.length+' пунктов':'',
    куда:'#irreplace', зачем:'заполните карту незаменимости'}
  ];

  var готово=пункты.filter(function(п){return п.ок;}).length;
  сетка.innerHTML=пункты.map(function(п){
   return '<div class="pl-i'+(п.ок?' ok':'')+'">'+
    '<div class="pl-k">'+п.к+'</div>'+
    (п.ок ? '<div class="pl-v">'+п.з+'</div>'
          : '<a class="pl-go" href="'+п.куда+'">'+п.зачем+'</a>')+
   '</div>';
  }).join('');

  // текст, который человек уносит
  var т='ПЛАН ПЕРЕДАЧИ ЗАДАЧИ\n\n';
  if(задачи_сп.length) т+='ДЕЛАЮ САМ, ХОТЯ МОГ БЫ НЕ ДЕЛАТЬ\n'+задачи_сп.map(function(з){return '— '+з;}).join('\n')+'\n\n';
  if(первая)  т+='НАЧИНАЮ С ЗАДАЧИ\n'+первая+'\n\n';
  if(часы)    т+='ЦЕНА ТОГО, ЧТОБЫ НЕ ПЕРЕДАВАТЬ\n'+часы+' ч в год'+
                 (ставка?' · '+(часы*ставка).toLocaleString('ru-RU')+' ₽':'')+
                 ' — примерно '+Math.round(часы/8)+' рабочих дней\n\n';
  if(задание_т) т+='ЗАДАНИЕ ИСПОЛНИТЕЛЮ\n'+задание_т+'\n\n';
  if(контроль_есть){
   var точки=[].slice.call(document.querySelectorAll('#k_out .res-t tr')).slice(1)
     .map(function(р){var я=р.querySelectorAll('td');return я.length?'— '+я[0].innerText+' ('+я[2].innerText+')':'';})
     .filter(Boolean);
   if(точки.length) т+='ТОЧКИ КОНТРОЛЯ\n'+точки.join('\n')+'\n\n';
  }
  // границы решений тоже уносятся с планом — раньше терялись
  var границыТ=($('c_out')&&$('c_out').classList.contains('on'))?$('c_out').textContent.trim():'';
  if(границыТ) т+=границыТ+'\n\n';
  if(карта_сп.length){
   т+='ЧТО МЕШАЕТ УЙТИ В ОТПУСК\n'+карта_сп.map(function(с){return '— '+с.что+' ('+с.тип+')';}).join('\n')+'\n\n';
  }
  т+='———\nЗаполнено '+готово+' из 6. '+
     (готово===6 ? 'План готов: можно отдавать задачу.' : 'Вернитесь к пустым пунктам — они помечены выше.');

  var о=$('plan_out');
  о.textContent=т;
  о.classList.toggle('on',готово>0);
 };

 задачи(); план();

 // ── копирование ─────────────────────────────────────────────────────────
 window.копировать=function(id,кн){
  var э=$(id);
  if(!э.classList.contains('on')){ return; }
  navigator.clipboard.writeText(э.innerText).then(function(){
   var было=кн.textContent; кн.textContent='Скопировано ✓';
   setTimeout(function(){кн.textContent=было;},1500);
  });
 };
})();
