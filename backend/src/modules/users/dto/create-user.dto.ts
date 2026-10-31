import {ApiProperty} from "@nestjs/swagger";
import {IsEmail, IsNotEmpty, IsString, MinLength} from 'class-validator';
export class CreateUserDto {
    @ApiProperty({example: 'user@example.com'})
    @IsEmail()
    email: string;

    @ApiProperty({example: 'First name Last name'})
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: 'HardPassword', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;
}
