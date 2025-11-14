import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import jwt from "jsonwebtoken";
import { UserController } from "@/modules/controllers/UserController";
import _ from "lodash";
import { AuthController } from "@/modules/controllers/AuthController";
import { LinkedinProvider } from "./customProviders";
import { JwtUtils } from "@/utils/jwtUtils";

const userController = new UserController();
const authController = new AuthController();

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    LinkedinProvider({
      clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_APPLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "john@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (credentials?.email && credentials?.password) {
          try {
            const dbUser = await authController.LoginWithPassword({
              email: credentials?.email!,
              password: credentials?.password!,
            });

            if (!dbUser) throw new Error("Invalid Credential");

            if (dbUser?.isEmailVerified == false) {
              throw new Error("Please verify your email");
            }

            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
            };
          } catch (error: unknown) {
            if (error instanceof Error) {
              throw new Error(error?.message);
            }
            throw new Error("Something went wrong, please try again");
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.NEXTAUTH_JWT_SECRET || process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, account, user }: any) {
      // Handle credentials provider (user is present, but account is null)
      if (user && !account) {
        try {
          let userFromDB = await userController.getUserAccount({
            email: user.email,
          });

          if (!userFromDB) {
            throw new Error("User not found");
          }

          const permissions = await authController.getRoleRoutes({
            roleId: userFromDB.roleId,
          });

          token.accessToken = await JwtUtils.generateToken({
            email: userFromDB.email,
            id: userFromDB.id,
            roleId: userFromDB.roleId,
            isSeller: !!userFromDB?.sellerProfile,
            isSellerApproved: !!userFromDB?.sellerProfile?.isApproved,
            sellerId: userFromDB?.sellerProfile?.id
              ? userFromDB?.sellerProfile?.id
              : null,
            permissions,
          });
          // Set required NextAuth token fields
          token.sub = userFromDB.id;
          token.id = userFromDB.id;
          token.email = userFromDB.email || user.email;
          token.name = userFromDB.name || user.name;
          token.roleId = userFromDB.roleId;
          token.isSeller = !!userFromDB?.sellerProfile;
          token.isSellerApproved = !!userFromDB?.sellerProfile?.isApproved;
          token.sellerId = userFromDB?.sellerProfile?.isApproved
            ? userFromDB?.sellerProfile?.id
            : undefined;
          token.permissions = permissions || [];
          if (userFromDB.profile) {
            token.profile = userFromDB.profile;
          }
          token.provider = "credentials";
          token.createdAt = Date.now();
        } catch (error) {
          console.error("Error in JWT callback for credentials:", error);
          throw error;
        }
      }

      // Handle OAuth providers (account is present)
      if (account) {
        // console.log("token ", token);
        // console.log("account ", account);
        // console.log("user ", user);

        let userFromDB = await userController.getUserAccount({
          email: user.email,
        });

        if (_.isEmpty(userFromDB)) {
          const password = Math.floor(1000 + Math.random() * 9000);

          userFromDB = await userController.createUserAccount({
            email: user.email,
            name: user.name,
            profile: user.image ?? "",
            roleId: userController.Roles.USER,
            password: String(password),
          });
        }

        const permissions = await authController.getRoleRoutes({
          roleId: userFromDB.roleId,
        });

        token.accessToken = await JwtUtils.generateToken({
          email: userFromDB.email,
          id: userFromDB.id,
          roleId: userFromDB.roleId,
          isSeller: !!userFromDB?.sellerProfile,
          isSellerApproved: !!userFromDB?.sellerProfile?.isApproved,
          sellerId: userFromDB?.sellerProfile?.id
            ? userFromDB?.sellerProfile?.id
            : null,
          permissions,
        });
        token.id = userFromDB.id;
        token.roleId = userFromDB.roleId;
        token.isSeller = !!userFromDB?.sellerProfile;
        token.isSellerApproved = !!userFromDB?.sellerProfile?.isApproved;
        token.sellerId = userFromDB?.sellerProfile?.isApproved
          ? userFromDB?.sellerProfile?.id
          : null;
        token.permissions = permissions;
        token.profile = userFromDB.profile;
        token.provider = account.provider;
        token.expiration = account.expires_at;
        token.createdAt = Date.now();
      }
      // Ensure token has required fields and filter out empty strings
      if (!token.sub && token.id) {
        token.sub = token.id;
      }
      // Remove empty string values that could cause issues
      Object.keys(token).forEach((key) => {
        if (token[key] === "") {
          delete token[key];
        }
      });
      
      return token;
    },
    async session({ session, token }: any) {
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token.provider) {
        session.provider = token.provider;
      }
      if (token.expiration) {
        session.expiration = token.expiration;
      }
      if (token.createdAt) {
        session.createdAt = token.createdAt;
      }
      if (token.profile) {
        session.user.image = token.profile;
      }
      if (token.id) {
        session.user.id = token.id;
      }
      if (token.roleId) {
        session.user.roleId = token.roleId;
      }
      if (token.isSeller !== undefined) {
        session.user.isSeller = token.isSeller;
      }
      if (token.isSellerApproved !== undefined) {
        session.user.isSellerApproved = token.isSellerApproved;
      }
      if (token.sellerId) {
        session.user.sellerId = token.sellerId;
      }
      if (token.permissions) {
        session.permissions = token.permissions;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log({ url, baseUrl });
      // If url is already a full URL
      if (url.startsWith("http://") || url.startsWith("https://")) {
        // If it's from the same origin, return it
        if (url.startsWith(baseUrl)) {
          return url;
        }
        // Otherwise, return baseUrl (security: don't redirect to external URLs)
        return baseUrl;
      }
      // If url is a relative path, ensure it starts with /
      const path = url.startsWith("/") ? url : `/${url}`;
      return `${baseUrl}${path}`;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,

  // need to uncomment this for apple auth
  // cookies: {
  //   pkceCodeVerifier: {
  //     name: `next-auth.pkce.code_verifier`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: "none",
  //       path: "/",
  //       secure: true,
  //       maxAge: 60 * 15,
  //     },
  //   },

  // },

  // useSecureCookies: true,
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export { authOptions };
