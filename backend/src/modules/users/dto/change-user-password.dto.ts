import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'OldPassword!' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'NewPassword', minLength: 8 })
    @IsString()
    @MinLength(8)
    newPassword: string;
}