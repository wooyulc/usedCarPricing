import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { randomBytes, scrypt as _scrypt } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
    constructor(private userService: UsersService) {}

    async signup(email: string, password: string) {
        // check if email is in use
        const users = this.userService.find(email);
        if((await users).length) {
            throw new BadRequestException('email in use');
        }
        // hash the users password
        // Generate the salt 
        const salt = randomBytes(8).toString('hex');
        // Hash the salt and the apssword together
        const hash = (await scrypt(password, salt, 32)) as Buffer;
        // join the hashed result and the salt togehter
        const result = salt + '.' + hash.toString('hex');
        // create a new user and save it
        const user = await this.userService.create(email, result);
        // return the user

    }
    async signin(email: string, password: string) {
        // find one user which has the email
        const [user] = await this.userService.find(email);
        if(!user) {
            throw new NotFoundException('user not found');
        }

        const [salt, storedHash] = user.password.split('.');
        const hash = (await scrypt(password, salt, 32)) as Buffer;

        if(storedHash !== hash.toString('hex')) {
            throw new BadRequestException('wrong password');
        } 
        return user;
        }
}