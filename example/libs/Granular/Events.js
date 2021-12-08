//particolarità: gli array in JS sono oggetti della classe Array e posso creare e impostare dei nuovi campi per ogni istanza di essi

class Events {
  constructor() {
    this.listeners = []; //cosruirò un nuovo parametro per questo oggetto Array e imposterò il suo valore 
  }

  on(events, listener) { //assumiamo events come string e listener come funzione lambda
    if (typeof events === 'string') {
      events = [ events ];
    }

    events.forEach(event => { //setta il listener di quell'evento
      
      if (!this.listeners[event]) {
        this.listeners[event] = []; //il campo "event" dell'oggetto di classe Array "listeners" viene ora impostato come un array vuoto,
                                    //nota come potevo accedervi anche facendo listeners.event

      }

      this.listeners[event].push(listener); //il campo "event" dell'oggetto/Array listeners non è più un array vuoto, this.listeners.event faccio in modo che sia una
                                            // funzione lambda
    });
  }

  off(events, listener) {
    if (typeof events === 'string') {
      events = [ events ];
    }

    events.forEach(event => {
      if (!this.listeners[event]) {
        return;
      }

      if (this.listeners[event].indexOf(listener) !== -1) {
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
      }
    });
  }

  fire(event, context) {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event].forEach(function(listener) { //listeners.event (uguale a dire listeners[event]) è la funzione da runnare quando capita quell'event
      listener(context); //runno la funzione passandogli come input un oggetto context, notare che in index.js la funzione è un console.log e passargli il context è inutile
                          //nonostante ciò in Granular.js ogni volta che viene chiamato fire viene passato anche un context, volendo utilizzabile
    });
  };
}

export default Events;
