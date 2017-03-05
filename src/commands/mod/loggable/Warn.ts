import { Command, Message, Middleware } from 'yamdbf';
import { User, GuildMember } from 'discord.js';
import ModBot from '../../../lib/ModBot';
import { modCommand } from '../../../lib/Util';

export default class Warn extends Command<ModBot>
{
	public constructor(bot: ModBot)
	{
		super(bot, {
			name: 'warn',
			aliases: [],
			description: 'Give a formal warning to a user',
			usage: '<prefix>warn <member> <...reason>',
			extraHelp: '',
			group: 'mod',
			guildOnly: true
		});

		this.use(modCommand);

		const { resolveArgs, expect } = Middleware;
		this.use(resolveArgs({ '<member>': 'Member', '<...reason>': 'String' }));
		this.use(expect({ '<member>': 'Member', '<...reason>': 'String' }));
	}

	public async action(message: Message, [member, reason]: [GuildMember, string]): Promise<any>
	{
		const user: User = member.user;
		if (user.id === message.author.id)
			return message.channel.send(`I don't think you want to warn yourself.`);

		const modRole: string = message.guild.storage.getSetting('modrole');
		if ((member && member.roles.has(modRole)) || user.id === message.guild.ownerID || user.bot)
			return message.channel.send('You may not use this command on that user.');

		const warning: Message = <Message> await message.channel.send(
			`Warning ${user.username}#${user.discriminator}...`);

		try
		{
			await user.send(`**You've received a warning in ${message.guild.name}.**\n\n**Reason:** ${reason}`);
		}
		catch (err)
		{
			message.channel.send(
				`Logged case but failed to send warning DM to ${user.username}#${user.discriminator}.`);
		}

		await this.bot.mod.actions.warn(user, message.guild);
		await this.bot.mod.logger.caseLog(user, message.guild, 'Warn', reason, message.author);
		console.log(`Warned ${user.username}#${user.discriminator} in guild '${message.guild.name}'`);
		warning.edit(`Warned ${user.username}#${user.discriminator}`);
	}
}
