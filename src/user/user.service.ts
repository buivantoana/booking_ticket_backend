import { Injectable } from '@nestjs/common';
import { IUser } from './interface/user.interface';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { EmailService } from 'src/mail/mail.service';
import { RolePermission } from 'src/role_permission/schema/role_permission.schema';

@Injectable()
export class UserService {
  private readonly secretKey = 'token';
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly mailService: EmailService,
  ) {}

  generateRandomPassword(length: number) {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  async createToken(user: IUser) {
    let token = await sign(
      {
        email: user.email,
        role: user.role,
        _id: user._id,
        permission: user.permission,
      },
      this.secretKey,
      { expiresIn: '1d' },
    );
    return token;
  }
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async signup(user: IUser): Promise<any> {
    try {
      let email = await this.userModel.find({ email: user.email });
      if (email[0]) {
        return {
          status: 1,
          message: 'Email da ton tai',
        };
      }
      let password = this.generateRandomPassword(6);
      let mail = await this.mailService.sendMail(
        'toanbvph30125@fpt.edu.vn',
        'Signup PassWord',
        password,
      );
      if (!mail) {
        return {
          status: 1,
          message: 'gui mail that bai',
        };
      }
      password = await this.hashPassword(password);

      const data = new this.userModel({ ...user, password }).save();

      return {
        status: 0,
        message: 'create user success',
        data,
      };
    } catch (error) {
      return {
        status: 1,
        message: error,
      };
    }
  }
  async create(user: IUser): Promise<any> {
    try {
      let email = await this.userModel.find({ email: user.email });
      if (email[0]) {
        return {
          status: 1,
          message: 'Email da ton tai',
        };
      }
      let password = this.generateRandomPassword(6);
      let mail = await this.mailService.sendMail(
        'toanbvph30125@fpt.edu.vn',
        'Signup PassWord',
        password,
      );
      if (!mail) {
        return {
          status: 1,
          message: 'gui mail that bai',
        };
      }
      password = await this.hashPassword(password);

      const data = new this.userModel({ ...user, password }).save();

      return {
        status: 0,
        message: 'create user success',
        data,
      };
    } catch (error) {
      return {
        status: 1,
        message: error,
      };
    }
  }
  async signin(user: IUser) {
    try {
      let data = await this.userModel.find({ email: user.email });

      if (!data[0]) {
        return {
          status: 1,
          message: 'email ko ton tai',
        };
      }
      let password = await bcrypt.compare(user.password, data[0].password);

      if (!password) {
        return {
          status: 1,
          message: 'Mat khau sai',
        };
      }

      let token = await this.createToken({
        email: data[0].email,
        role: data[0].role,
        _id: data[0]._id,
      });
      let refeshToken = await sign(
        {
          email: data[0].email,
          role: data[0].role,
          _id: data[0]._id,
        },
        this.secretKey,
      );
      data[0].password = null;
      return {
        token,
        refeshToken,
        data,
      };
    } catch (error) {
      return {
        status: 1,
        message: error,
      };
    }
  }
  async refeshtoken(token: string) {
    try {
      const data: any = await verify(token, this.secretKey);
      const datanew = await this.userModel.findById(data._id);
      if (data) {
        const newdata = {
          email: datanew.email,
          role: datanew.role,
          _id: datanew._id,
        };
        const accessToken = await this.createToken(newdata);

        return {
          status: 0,
          message: 'token refesh',
          accessToken: accessToken,
          datanew,
        };
      }
    } catch (error) {}
  }
  async fillAllUser() {
    try {
      let data = await this.userModel.find();

      if (!data) {
        return {
          status: 1,
          message: 'failed',
        };
      }
      return {
        status: 0,
        message: 'suceess',
        data,
      };
    } catch (error) {
      console.log(error);
    }
  }
  async deleteUser(id: string) {
    try {
      let data = await this.userModel.findByIdAndDelete(id);
      if (!data) {
        return {
          status: 1,
          message: 'failed',
        };
      }
      return {
        status: 0,
        message: 'suceess',
        data,
      };
    } catch (error) {
      console.log(error);
    }
  }
  async updateUser(id: string, user: IUser) {
    try {
      let data = await this.userModel.findByIdAndUpdate(id, user, {
        new: true,
      });
      if (!data) {
        return {
          status: 1,
          message: 'failed',
        };
      }
      return {
        status: 0,
        message: 'suceess',
        data,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
