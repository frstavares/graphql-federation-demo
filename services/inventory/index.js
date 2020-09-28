const { ApolloServer, gql } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");
const { SchemaDirectiveVisitor } = require("apollo-server");
const request = require("request-promise-native");

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

  extend type Product @key(fields: "upc") {
    upc: String! @external
    weight: Int @external
    price: Int @external
    inStock: Boolean
    shippingEstimate: Int @requires(fields: "price weight")
  }
`;

const resolvers = {
  Product: {
    __resolveReference(object) {
      return {
        ...object,
        ...inventory.find((product) => product.upc === object.upc),
      };
    },
    shippingEstimate(object) {
      // free for expensive items
      if (object.price > 1000) return 0;
      // estimate is based on weight
      return object.weight * 0.5;
    },
  },
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

server.listen({ port: 6004 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const inventory = [
  { upc: "1", inStock: true },
  { upc: "2", inStock: false },
  { upc: "3", inStock: true },
];
