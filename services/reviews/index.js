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

  type Review @key(fields: "id") {
    id: ID!
    body: String
    author: User @provides(fields: "username")
    product: Product
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    username: String @external
    reviews: [Review]
  }

  extend type Product @key(fields: "upc") {
    upc: String! @external
    reviews: [Review]
  }
`;

const resolvers = {
  Review: {
    author(review) {
      return { __typename: "User", id: review.authorID };
    },
  },
  User: {
    reviews(user) {
      return reviews.filter((review) => review.authorID === user.id);
    },
    numberOfReviews(user) {
      return reviews.filter((review) => review.authorID === user.id).length;
    },
    username(user) {
      const found = usernames.find((username) => username.id === user.id);
      return found ? found.username : null;
    },
  },
  Product: {
    reviews(product) {
      return reviews.filter((review) => review.product.upc === product.upc);
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

server.listen({ port: 6002 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const usernames = [
  { id: "1", username: "@ada" },
  { id: "2", username: "@complete" },
];
const reviews = [
  {
    id: "1",
    authorID: "1",
    product: { upc: "1" },
    body: "Love it!",
  },
  {
    id: "2",
    authorID: "1",
    product: { upc: "2" },
    body: "Too expensive.",
  },
  {
    id: "3",
    authorID: "2",
    product: { upc: "3" },
    body: "Could be better.",
  },
  {
    id: "4",
    authorID: "2",
    product: { upc: "1" },
    body: "Prefer something else.",
  },
];
