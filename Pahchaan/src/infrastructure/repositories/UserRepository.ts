import { MongoRepository } from "./MongoRepository";
import { User } from "@/domain/types";

export class UserRepository extends MongoRepository<User> {
  constructor() {
    super("users");
  }
}

export const userRepository = new UserRepository();
