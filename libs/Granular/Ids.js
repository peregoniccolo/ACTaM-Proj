
export default class Ids {
  constructor(prefix = '') {
    this.id = 0;
    this.prefix = prefix;
  }

  next() {
    var id = `${ this.prefix }_${ this.id++ }`;
    console.log("id in next: " + id);
    return id
  }
}