// ── Чтение файла таблицы: xlsx и csv ───────────────────────────────────────
// Свой разбор, без библиотек: xlsx — это zip-архив, а распаковку умеет сам браузер
// (DecompressionStream). Так страница остается автономной: ничего не грузим извне,
// файл не уходит на сервер — все считается прямо в браузере.
(function () {

 // ── zip: достаем нужные файлы ────────────────────────────────────────────
 // Читаем «оглавление» в конце архива (central directory), оттуда узнаем,
 // где лежит каждый файл и как он сжат.
 async function изZip(буфер, нужные) {
  var д = new DataView(буфер);
  var б = new Uint8Array(буфер);

  // оглавление ищем с конца: подпись 0x06054b50
  var конец = -1;
  for (var i = б.length - 22; i >= Math.max(0, б.length - 66000); i--) {
   if (д.getUint32(i, true) === 0x06054b50) { конец = i; break; }
  }
  if (конец < 0) throw new Error("не архив");

  var всего = д.getUint16(конец + 10, true);
  var начало = д.getUint32(конец + 16, true);
  var найдено = {};
  var п = начало;

  for (var n = 0; n < всего; n++) {
   if (д.getUint32(п, true) !== 0x02014b50) break;
   var метод = д.getUint16(п + 10, true);
   var размер = д.getUint32(п + 20, true);
   var длИмени = д.getUint16(п + 28, true);
   var длДоп = д.getUint16(п + 30, true);
   var длКомм = д.getUint16(п + 32, true);
   var смещ = д.getUint32(п + 42, true);
   var имя = new TextDecoder().decode(б.subarray(п + 46, п + 46 + длИмени));

   if (нужные.some(function (ш) { return ш.test(имя); })) {
    // у самого файла свой заголовок — его длина плавает, читаем на месте
    var лДлИмени = д.getUint16(смещ + 26, true);
    var лДлДоп = д.getUint16(смещ + 28, true);
    var данные = б.subarray(смещ + 30 + лДлИмени + лДлДоп,
                            смещ + 30 + лДлИмени + лДлДоп + размер);
    найдено[имя] = метод === 0 ? данные : await распаковать(данные);
   }
   п += 46 + длИмени + длДоп + длКомм;
  }
  return найдено;
 }

 async function распаковать(данные) {
  // deflate-raw — то, чем сжимает zip. Браузер умеет это сам.
  var поток = new Blob([данные]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(поток).arrayBuffer());
 }

 // ── xlsx: листы + общие строки ───────────────────────────────────────────
 // Текст в xlsx хранится отдельно (sharedStrings), в самом листе — только номера.
 // Читаем ВСЕ листы с данными, а не только первый: живой прогон показал, что
 // люди ведут недели на отдельных листах — и они молча пропадали из разбора.
 async function изXlsx(буфер) {
  var файлы = await изZip(буфер, [/^xl\/worksheets\/sheet\d+\.xml$/, /^xl\/sharedStrings\.xml$/,
    /^xl\/workbook\.xml$/, /^xl\/_rels\/workbook\.xml\.rels$/]);

  var общие = [];
  if (файлы["xl/sharedStrings.xml"]) {
   var сд = new DOMParser().parseFromString(
     new TextDecoder().decode(файлы["xl/sharedStrings.xml"]), "application/xml");
   общие = [].map.call(сд.getElementsByTagName("si"), function (si) {
    // текст может быть разбит на куски (<t> внутри <r>) — склеиваем
    return [].map.call(si.getElementsByTagName("t"), function (t) {
     return t.textContent;
    }).join("");
   });
  }

  // Порядок и имена листов — из workbook.xml. Листы-инструкции пропускаем:
  // иначе примеры с листа «Как заполнять» посчитаются как реальные задачи.
  var СЛУЖЕБНЫЙ = /как заполн|инструкц|пример|справоч|словар/i;
  var пути = [];
  if (файлы["xl/workbook.xml"] && файлы["xl/_rels/workbook.xml.rels"]) {
   var вб = new DOMParser().parseFromString(
     new TextDecoder().decode(файлы["xl/workbook.xml"]), "application/xml");
   var релс = new DOMParser().parseFromString(
     new TextDecoder().decode(файлы["xl/_rels/workbook.xml.rels"]), "application/xml");
   var цели = {};
   [].forEach.call(релс.getElementsByTagName("Relationship"), function (р) {
    цели[р.getAttribute("Id")] = р.getAttribute("Target") || "";
   });
   [].forEach.call(вб.getElementsByTagName("sheet"), function (л) {
    var имя = л.getAttribute("name") || "";
    var цель = цели[л.getAttribute("r:id")] || "";
    цель = цель.replace(/^\//, "");
    if (!/^xl\//.test(цель)) цель = "xl/" + цель;
    if (СЛУЖЕБНЫЙ.test(имя)) return;
    if (файлы[цель]) пути.push(цель);
   });
  }
  if (!пути.length) {
   // workbook.xml не прочитался — берем все sheetN по номерам
   пути = Object.keys(файлы).filter(function (и) { return /^xl\/worksheets\//.test(и); })
     .sort(function (a, b) {
      return parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10);
     });
  }
  if (!пути.length) throw new Error("лист не найден");

  var строки = [];
  пути.forEach(function (путь) {
   изЛиста(файлы[путь], общие, строки);
  });
  return строки;
 }

 function изЛиста(байты, общие, строки) {
  var док = new DOMParser().parseFromString(new TextDecoder().decode(байты), "application/xml");
  [].forEach.call(док.getElementsByTagName("row"), function (row) {
   var ячейки = [];
   [].forEach.call(row.getElementsByTagName("c"), function (c) {
    var ссылка = c.getAttribute("r") || "";
    var кол = буква_в_номер((ссылка.match(/^[A-Z]+/) || ["A"])[0]);
    var тип = c.getAttribute("t");
    var v = c.getElementsByTagName("v")[0];
    var зн = "";

    if (тип === "s") {                       // ссылка на общую строку
     зн = общие[parseInt(v ? v.textContent : "0", 10)] || "";
    } else if (тип === "inlineStr") {
     var is = c.getElementsByTagName("t")[0];
     зн = is ? is.textContent : "";
    } else if (v) {
     зн = v.textContent;
     // время в таблицах — доля суток. 0,0417 = 1:00. Возвращаем как есть:
     // калькулятору нужны часы из колонки «Часы», а не время начала.
    }
    ячейки[кол] = зн;
   });
   // дыры превращаем в пустые ячейки, иначе строка разъедется
   for (var i = 0; i < ячейки.length; i++) if (ячейки[i] === undefined) ячейки[i] = "";
   строки.push(ячейки);
  });
 }

 function буква_в_номер(б) {
  var n = 0;
  for (var i = 0; i < б.length; i++) n = n * 26 + (б.charCodeAt(i) - 64);
  return n - 1;
 }

 // ── csv: с учетом кавычек и точки с запятой ──────────────────────────────
 function изCsv(текст) {
  // Excel в русской локали пишет через точку с запятой, Google — через запятую
  var разд = (текст.split("\n")[0].split(";").length > текст.split("\n")[0].split(",").length)
    ? ";" : ",";
  var строки = [], поле = "", ряд = [], вКавычках = false;

  for (var i = 0; i < текст.length; i++) {
   var с = текст[i];
   if (вКавычках) {
    if (с === '"') {
     if (текст[i + 1] === '"') { поле += '"'; i++; }   // экранированная кавычка
     else вКавычках = false;
    } else поле += с;
   } else if (с === '"') вКавычках = true;
   else if (с === разд) { ряд.push(поле); поле = ""; }
   else if (с === "\n") { ряд.push(поле); строки.push(ряд); ряд = []; поле = ""; }
   else if (с !== "\r") поле += с;
  }
  if (поле || ряд.length) { ряд.push(поле); строки.push(ряд); }
  return строки;
 }

 // ── общая точка входа ────────────────────────────────────────────────────
 window.читатьФайл = async function (файл) {
  var имя = (файл.name || "").toLowerCase();

  if (/\.xlsx$/.test(имя)) {
   var строки = await изXlsx(await файл.arrayBuffer());
   return строки.map(function (р) { return р.join("\t"); }).join("\n");
  }

  if (/\.csv$/.test(имя) || /\.tsv$/.test(имя) || /\.txt$/.test(имя)) {
   var т = new TextDecoder("utf-8").decode(await файл.arrayBuffer());
   if (/\.tsv$/.test(имя)) return т;
   return изCsv(т).map(function (р) { return р.join("\t"); }).join("\n");
  }

  if (/\.xls$/.test(имя)) {
   throw new Error("Старый формат .xls не читаю. В таблице: Файл → Скачать → Excel (.xlsx)");
  }
  if (/\.ods$/.test(имя) || /\.numbers$/.test(имя)) {
   throw new Error("Этот формат не читаю. В таблице: Файл → Скачать → Excel (.xlsx) или CSV");
  }
  throw new Error("Нужен файл таблицы: .xlsx или .csv");
 };
})();
