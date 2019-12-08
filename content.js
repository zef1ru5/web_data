/* eslint-disable no-undef */
console.log('content');


// --- Manager: save and download and logs---
class Manager {
  constructor () {
    this.protector = new Protector();
  }

  getText(selectedElements, predictedElements) {
    if (predictedElements.length == 0) return false
    let message = "";
    for (let elem of predictedElements) message += elem.textContent +"\n";
    for (let elem of selectedElements) message += elem.textContent +"\n";
    return message
  }

  Save(request, selectedElements, predictedElements) {
    let message = this.getText(selectedElements, predictedElements);
    if (message == false) { alert('Данные не анализированы'); return }

    let login = request.login;
    let password = request.password;        
    
    // Protector
    let encryptText = this.protector.getEncryptSecretAndText(message, password);

    let encryptData = {
      'encryptText': encryptText
    };

    let jsonEncryptData = JSON.stringify(encryptData);
    localStorage.setItem(login, jsonEncryptData);    
    alert('Данные сохранены успешно.');
  }

  Down(request) {    
    let login = request.login;
    let password = request.password;

    let jsonEncryptData = localStorage.getItem(login); // проверка ЛОГИНА
    if (jsonEncryptData == null) { alert('Нет данных для загрузки'); return }

    let encryptData = JSON.parse(jsonEncryptData);
    let encryptText = encryptData['encryptText'];

    let message = this.protector.checkSecretAndGetDecryptText(encryptText, password);

    if (message == false) { // LOGS
      let jsoninfo = localStorage.getItem('logs');
      if (jsoninfo == null) {
        let log = {
          'login': login,
          'times': [Date.now()]
        };
        let info = [];
        info.push(log);
        jsoninfo = JSON.stringify(info);
        localStorage.setItem('logs', jsoninfo); 
      } else {
          let info = JSON.parse(jsoninfo);
          let findLogin = false;
          for (let idx = 0; idx <info.length; idx++) {

            let obj = info[idx];
            if (obj['login'] == login) {
              findLogin = true;

              let minTime = obj['times'][0];
              let index = 0;
              let writeTime = false;
              for (let tt=0; tt < 5; tt++) {
                let tme = obj['times'][tt];
                if (tme == undefined) { info[idx]['times'][tt] = Date.now(); writeTime = true; break; } // [1, 2]
                if (tme < minTime) { minTime = tme ;index = tt }
              }
              if (writeTime == false) { info[idx]['times'][index] = Date.now(); break; } // [1, 2, 3, 4, 5]
            }
            if (findLogin == true) break;
          }

          if (findLogin == false) {
            let log = { 
              'login': login,
              'times': [Date.now()]
            };
            info.push(log);            
          }
          jsoninfo = JSON.stringify(info);
          localStorage.setItem('logs', jsoninfo);
      }
      

      alert('Неверный пароль'); 
      return 
    } // проверка целостность/пароль

    // download message
    let downLink = document.createElement("a");
    downLink.setAttribute("type", "hidden");
    downLink.setAttribute("download", "data.csv");
    downLink.setAttribute("href", "");
    document.querySelector("body").appendChild(downLink);

    let data = new Blob([message], {type: 'text/csv; charset=UTF-8'});
    let url = window.URL.createObjectURL(data);
    downLink.href = url;
    downLink.click();      
    window.URL.revokeObjectURL(url);
    downLink.remove();
  }

  Logs(request) {
    let login = request.login;
    let jsoninfo = localStorage.getItem('logs');
    if (jsoninfo == null) {alert('Нет логов'); return}
    let info = JSON.parse(jsoninfo);

    let message = '';
    let findLogin = false;
    for (let idx = 0; idx < info.length; idx++) {
      let obj = info[idx];
      if (obj['login'] == login) {
        findLogin = true;        
        for (let tt=0; tt < obj['times'].length; tt++) message += new Date(obj['times'][tt]).toString()  +"\n";
      }
      if (findLogin == true) {alert(message); return}
    }

    if (findLogin == false) {alert('У вас небыло ошибок'); return}

  }


}


// --- collect ---
class Сollector {
  constructor() {
    this.dataSet = {};
    this.nodeRoot = document.body.querySelectorAll('*'); // все элементв в body по порядку
    this.illegalTags = ['SCRIPT', 'STYLE'];
    this.labels = [
      'nameTag',
      'countChildren',
      'level',
      'nameClass1', 'nameClass2',
      'nameParent1', 'nameParent2',
      'nameParent3', 'nameParent4',
      'nameParent5', 'nameParent6',
      'nameParent7', 'nameParent8',
      'nameParent9', 'nameParent10',
      'color', 'height', 'width', 'font-size', 'inline-size', 'font-weight', 'block-size', 'line-height', 'perspective-origin', 'font-family'
    ];

    this.anyCss = ['color', 'height', 'width', 'font-size', 'inline-size', 'font-weight', 'block-size', 'line-height', 'perspective-origin', 'font-family'];
  }

  nameTag(element) {
    return element.nodeName
  }

  countChildren(element) {
    let count = element.querySelectorAll('*').length;
    return count.toString()
  }

  level(element, num) {
    let level = 0;
        console.log(num);//test
    while (element.nodeName != 'BODY') {
      element = element.parentNode;
      level++;
    }
    return level.toString()

    // try {
    //   while (element.nodeName != 'BODY') {
    //     element = element.parentNode;
    //     level++;
    //   }
  
    //   return level.toString()
    // } catch (err) {
    //   console.log(element, num);
    // }
    
  }

  nameClass(element) {
    let countClass = 2;
    let result = [];

    try {
      let strClass = element.className;
      let arrClass = strClass.split(' ');
      for (let i = 0; i < countClass; i++) {
        let nameCls = '';
        if ((arrClass[i] == undefined) || (arrClass[i] == "")) { // если второго класса нет, либо нет классов совсем -> -1
          result.push("-1");
        } else {
          nameCls = arrClass[i];
          result.push(nameCls)
        }
      }
    } catch (err) {
      this.illegalTags.push(element.nodeName);
      return false;
    }

    return result
  }

  nameParent(element) {
    let countParent = 10;
    let result = [];

    for (let i = 1; i <= countParent; i++) {
      let countPar = '';
      if (element.parentNode == null) { // если нет родителя -> вставить родителя последнего элемента (для элементов рядом с body)
        result.push("-1");
      } else {
        element = element.parentNode;
        countPar = element.nodeName;
        result.push(countPar);
      }
    }

    return result
  }

  // возвращает target: при отсутствии NaN, либо сроку
  getTarget(element, datasetClassName) {
    let target = element.dataset[datasetClassName];
    if (target == undefined) { return 'NaN' }
    else { return target }
  }

  isIllegalTag(element) {
    let state = false;
    for (let name of this.illegalTags) {
      if (element.nodeName == name) {
        state = true;
        break;
      }
    }
    return state
  }

  collectDataSet(datasetClassName) {
    let trainSet = [];
    let testSet = [];
    let targets = [];

    let testSetId = [];
    let nodeLength = this.nodeRoot.length;

    // обход в глубину
    for (let i = 0; i < nodeLength; i++) {
      let vector = [];
      let element = this.nodeRoot[i];

      let noLegal = this.isIllegalTag(element);
      if (noLegal == true) { continue };

      let nameTag = this.nameTag(element);
      let countChildren = this.countChildren(element); 
      let level = this.level(element, i); // i - test
      let nameClass = this.nameClass(element);
      if (nameClass == false) { continue };
      let nameParent = this.nameParent(element);
      let style = this.style(element);
      let target = this.getTarget(element, datasetClassName);

      vector.push(nameTag, countChildren, level, ...nameClass, ...nameParent, ...style);

      if (target == 'NaN') {   // testSet
        testSet.push(vector);
        testSetId.push(i);  // для последующего нахождения элемента по id
      } else {              // trainSet 
        trainSet.push(vector);
        targets.push(target);
      }
    }

    this.dataSet = {
      'trainSet': trainSet,
      'testSet': testSet,
      'targets': targets,
      'labels': this.labels,
      'testSetId': testSetId,
      'pageElements': this.nodeRoot,
    };
  }

  // Ssleep(milliseconds) { //test
  //   let start = new Date().getTime();
  //   for (let i = 0; i < 1e7; i++) {
  //     if ((new Date().getTime() - start) > milliseconds){
  //       break;
  //     }
  //   }
  //   console.log('Sseep');
  // }

  getDataSet() {
    return this.dataSet;
  }

}


// --- select ---
class Selector {
  constructor() {
    this.selectedElements = [];

    // Event
    this.eventMethod = [
      { onEvent: 'mouseover', method: this.MouseOver.bind(this) },
      { onEvent: 'mouseout', method: this.MouseOut.bind(this) },
      { onEvent: 'click', method: this.ClickEffect.bind(this) }
    ];

    // Name dataset
    this.datasetClassName = `class${Date.now().toString()}`;
    this.dataClass = "Yes";
    this.datasetPredictName = `predict${Date.now().toString()}`;
    this.dataPredict = "Predict";
    this.datasetMoseName = `mouse${Date.now().toString()}`;
    this.dataMouseOverOut = "mouse";
    // Style CSS
    let style = document.createElement ( "style" ), styleSheet;    
    style.appendChild ( document.createTextNode ( "" ) );
    document.head.appendChild ( style );
    styleSheet = style.sheet;
    let rules = [
      `[data-${this.datasetPredictName}=${this.dataPredict}]{box-shadow: inset 0 0 4px 4px #8DB87C;}`,
      `[data-${this.datasetMoseName}=${this.dataMouseOverOut}]{box-shadow: 0 0 4px 4px #0c98cf;}`,
      `[data-${this.datasetClassName}=${this.dataClass}]{background-color: rgba(101, 206, 247, 0.5)}`
    ];
    for ( let st=0; st < rules.length; st++ ) {
      styleSheet.insertRule ( rules [st], st );
    }

  }

  // on/off
  ToggleEventListeners({ state }) {
    for (const item of this.eventMethod) {
      let onEvent = item['onEvent'], method = item['method'];
      if (state) document.addEventListener(onEvent, method);
      else document.removeEventListener(onEvent, method);
    }


  }

  MouseOver(event) {
    event.target.dataset[this.datasetMoseName] = this.dataMouseOverOut;
  }
  MouseOut(event) {
    delete event.target.dataset[this.datasetMoseName];
  }
  // добавить/удалить dataset
  ClickEffect(event) {
    event.preventDefault();
    let element = event.target
    if (event.ctrlKey) {
      delete element.dataset[this.datasetClassName];
      this.DelElement(element);
    } else {
      element.dataset[this.datasetClassName] = this.dataClass;
      this.PushUniqueElement(element);
    }
  }

  // добавляет только новые элементы в selected_Elements
  PushUniqueElement(element) {
    if (!this.selectedElements.includes(element)) {
      this.selectedElements.push(element);
    }
  }
  // удоляет элемент в selected_Elements
  DelElement(element) {
    let index = this.selectedElements.indexOf(element);
    if (index > -1) {
      this.selectedElements.splice(index, 1);
    }
  }
  

  getDatasetClassName() {
    return this.datasetClassName;
  }
  getDatasetPredictName() {
    return this.datasetPredictName;
  }
  getDataPredict() {
    return this.dataPredict;
  }
  getSelectedElements() {
    return this.selectedElements;
  }

  clearSelectedElements() {
    this.selectedElements = [];
  }

}


// -----------
class Main {
  constructor() {
    // Selector:on/off или Manager:Show/Save (from PopUp)
    chrome.runtime.onMessage.addListener(this.DetectMessage.bind(this));
    
    // при обновлении сбросить иконку (to Bacground)
    let message = { 'state': false };
    chrome.runtime.sendMessage(message);

    // сбросить свичер в PopUp
    chrome.storage.sync.set(message);

    this.selector = new Selector();
    this.collector = new Сollector();
    this.manager = new Manager();
    this.ml = new ML();    
  }

  DetectMessage(request) {
    switch (request.class) {
      case 'selector': this.selector.ToggleEventListeners(request);
                      if (request.state == false) this.clearDatasetsOnPage();
                      break;
      case 'manager': if (request.operation == 'save') {
                          this.manager.Save(request, this.selector.getSelectedElements(), this.ml.getPredictedElements() );
                          // отклдчение свичера и выделения
                          let swch = {'state': false};
                          chrome.runtime.sendMessage(swch); chrome.storage.sync.set(swch);
                          this.selector.ToggleEventListeners(swch);
                          this.clearDatasetsOnPage();
                        };
                        if (request.operation == 'down') this.manager.Down(request);
                        if (request.operation == 'logs') this.manager.Logs(request);
                       break;
      case 'main': this.Show(); break;

      case 'test': this.TEST(); break;
    }
    return true;
  }

  TEST(){
    this.collector.collectDataSet(this.selector.getDatasetClassName());
    let dataSet = this.collector.getDataSet(); 
    let testSet = dataSet['testSet']

    var ep=new ExcelPlus();
    ep.createFile("Book1")
      .write({ "content": testSet })
      // .write({ "sheet":"Book1", "cell":"D1", "content":new Date() })
      .saveAs("demo.xlsx");
  }







  Show() {
    // Collector (full)
    this.collector.collectDataSet(this.selector.getDatasetClassName());
    let dataSet = this.collector.getDataSet();    
    if ( dataSet['trainSet'].length == 0) { alert('Элементы не выбраны'); return }

    // Selector (part for show)
    let datasetPredictName = this.selector.getDatasetPredictName();
    let dataPredict = this.selector.getDataPredict();

    // clear dataset predicted elem
    let predictedElements = this.ml.getPredictedElements();
    for (let pageElem of predictedElements) delete pageElem.dataset[datasetPredictName];

    predictedElements = this.ml.newPredictedElements(dataSet['trainSet'], dataSet['targets'], dataSet['labels'], dataSet['testSet'], dataSet['testSetId'], dataSet['pageElements']);
    
    // set dataset prdected elem
    for (let pageElem of predictedElements) pageElem.dataset[datasetPredictName] = dataPredict;
  }


  clearDatasetsOnPage() {
    // При выкл 
    let selectedElements = this.selector.getSelectedElements();
    let datasetClassName = this.selector.getDatasetClassName();
    let datasetPredictName = this.selector.getDatasetPredictName();
    let predictedElements = this.ml.getPredictedElements();

    for (let element of selectedElements) delete element.dataset[datasetClassName];
    this.selector.clearSelectedElements(); // обнулить selected
    for (let element of predictedElements) delete element.dataset[datasetPredictName];
    this.ml.clearPredictedElements(); // обнулить predicted
  }

}

const main = new Main();