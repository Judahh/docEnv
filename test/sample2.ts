interface B {
  name: string;
}

class A {
  protected asd?: string;
}
/**
 * class of User
 */
class User extends A implements B {
  /**
   * constructor
   * @param name c-name
   */
  constructor(name: string) {
    super();
    this.name = name;
  }
  /**
   * property name
   */
  public name: string;
  /**
   * Set name
   * @param name f-name
   */
  public setName(name: string) {
    this.name = name;
    return name;
  }
}

const a = true;
const b = false;
const c = a && b;

export { a, b, c };

export default User;
