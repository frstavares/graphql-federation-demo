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

  extend type Query {
    me: User
  }

  type User @key(fields: "id") {
    id: ID!
    name: String
    username: String
  }
`;

const resolvers = {
  Query: {
    me() {
      return users[0];
    },
  },
  User: {
    __resolveReference(object) {
      return users.find((user) => user.id === object.id);
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

server.listen({ port: 6001 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

const users = [
  {
    id: "1",
    name: "Ada Lovelace",
    birthDate: "1815-12-10",
    username: "@ada",
  },
  {
    id: "2",
    name: "Alan Turing",
    birthDate: "1912-06-23",
    username: "@complete",
  },
];
