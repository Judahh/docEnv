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
   * setName
   * @param name f-name
   */
  public setName(name: string) {
    this.name = name;
    return name;
  }
}

export default User;
