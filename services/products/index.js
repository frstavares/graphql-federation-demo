const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const { SchemaDirectiveVisitor } = require("apollo-server");
const request = require("request-promise-native");
const { GraphQLScalarType } = require("graphql");

class RestDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { url } = this.args;

    // eslint-disable-next-line max-params
    field.resolve = async function () {
      const response = await request(url, {
        json: true,
        method: "GET",
      });

      return response;
    };
  }
}

const typeDefs = gql`
  directive @rest(url: String!) on FIELD_DEFINITION
  scalar JSON

  extend type Query {
    topProducts(first: Int = 5): [Product]
  }

  type Product @key(fields: "upc") {
    upc: String!
    name: String @deprecated(reason: "why")
    price: Int
    weight: Int
    test: JSON @rest(url: "https://postman-echo.com/get?something1=bar1&something2=bar2")
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
      return products.find((product) => product.upc === object.upc);
    },
  },
  Query: {
    topProducts(_, args) {
      return products.slice(0, args.first);
    },
  },
  JSON: new GraphQLScalarType({
    name: "JSON",
    description:
      "The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).",
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return value;
    },
  }),
};

const schema = buildFederatedSchema([
  {
    typeDefs,
    resolvers,
  },
]);
SchemaDirectiveVisitor.visitSchemaDirectives(schema, { rest: RestDirective });

const server = new ApolloServer({
  schema,
});

server.listen({ port: 6003 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const products = [
  {
    upc: "1",
    name: "Table",
    price: 899,
    weight: 100,
  },
  {
    upc: "2",
    name: "Couch",
    price: 1299,
    weight: 1000,
  },
  {
    upc: "3",
    name: "Chair",
    price: 54,
    weight: 50,
  },
];
