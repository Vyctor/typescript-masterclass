import pgPromise from "pg-promise";

interface Connection {
  query(statement: string, params: any): Promise<any>;
  close(): Promise<void>;
}

class PostgreSQLConnection implements Connection {
  pgp: any;

  constructor() {
    this.pgp = pgPromise()("postgres://postgres:123456@localhost:5432/app");
  }

  async query(statement: string, params: any): Promise<any> {
    return this.pgp.query(statement, params);
  }

  async close(): Promise<void> {
    return this.pgp.$pool.end();
  }
}

class Entity {
  declare schema: string;
  declare table: string;
  declare columns: { property: string; column: string }[];
  [key: string]: any;
}

function entity(config: { schema: string; table: string }) {
  return (constructor: Function) => {
    constructor.prototype.schema = config.schema;
    constructor.prototype.table = config.table;
  };
}

function column(config: { name: string }) {
  return (target: Entity, propertyKey: string) => {
    target.columns = target.columns || [];
    target.columns.push({ property: propertyKey, column: config.name });
  };
}

@entity({ schema: "branas", table: "books" })
class Book extends Entity {
  @column({ name: "title" })
  public title: string;
  @column({ name: "author" })
  public author: string;

  constructor(title: string, author: string) {
    super();
    this.title = title;
    this.author = author;
  }
}

class Orm {
  constructor(readonly connection: Connection) {}

  public async save(entity: Entity): Promise<void> {
    const columns = entity.columns.map((column) => column.column).join(",");
    const params = entity.columns
      .map((column, index) => `$${index + 1}`)
      .join(",");
    const values = entity.columns.map((column) => entity[column.property]);

    const statement: string = `insert into ${entity.schema}.${entity.table} values (${columns}) values(${params})`;

    this.connection.query(statement, [...values]);
  }

  public async find(entity: Entity): Promise<any> {
    return this.connection.query("select * from branas.books", []);
  }
}
